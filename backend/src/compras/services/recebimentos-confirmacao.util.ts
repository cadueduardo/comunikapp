import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  StatusPedidoCompra,
  StatusRecebimentoCompra,
  TipoItemCompra,
} from '@prisma/client';
import { RecebimentoItemDto } from '../dto/create-recebimento.dto';
import { saldoPendenteItem, updatePedidoStatusAposEvento } from './pedido-status-rollup.util';
import {
  registrarEntradaEstoqueRecebimento,
  registrarEstornoEstoqueRecebimento,
} from './recebimentos-estoque.util';

type Tx = Prisma.TransactionClient;

type PedidoReader = {
  pedidoCompra: {
    findFirst: Tx['pedidoCompra']['findFirst'];
  };
};

export const RECEBIMENTO_INCLUDE = {
  itens: true,
  pedido: { select: { id: true, numero: true, status: true } },
  responsavel: {
    select: { id: true, nome_completo: true, email: true },
  },
} as const;

export const STATUS_PEDIDO_RECEBIVEL: StatusPedidoCompra[] = [
  StatusPedidoCompra.ENVIADO,
  StatusPedidoCompra.PARCIAL,
  StatusPedidoCompra.APROVADO,
  StatusPedidoCompra.ATENDIDO,
];

export async function carregarPedidoRecebivel(
  db: PedidoReader,
  pedidoId: string,
  lojaId: string,
  exigirStatus = true,
) {
  const pedido = await db.pedidoCompra.findFirst({
    where: { id: pedidoId, loja_id: lojaId },
    include: { itens: true },
  });
  if (!pedido) {
    throw new NotFoundException('Pedido não encontrado nesta loja.');
  }
  if (exigirStatus && !STATUS_PEDIDO_RECEBIVEL.includes(pedido.status)) {
    throw new BadRequestException(
      `Pedido em status ${pedido.status} não permite recebimento.`,
    );
  }
  return pedido;
}

export function validarItensRecebimento(
  itensDto: RecebimentoItemDto[],
  pedidoItens: Array<{ id: string; tipo: TipoItemCompra }>,
) {
  const mapa = new Map(pedidoItens.map((i) => [i.id, i]));
  for (const item of itensDto) {
    const pedidoItem = mapa.get(item.pedido_item_id);
    if (!pedidoItem) {
      throw new BadRequestException(
        `Item ${item.pedido_item_id} não pertence ao pedido.`,
      );
    }
    if (pedidoItem.tipo !== TipoItemCompra.MATERIAL) {
      throw new BadRequestException(
        `Item ${item.pedido_item_id} não é MATERIAL; use aceite de serviço.`,
      );
    }
    const recusada = item.quantidade_recusada ?? 0;
    if (item.quantidade_aceita + recusada - item.quantidade_recebida > 1e-6) {
      throw new BadRequestException(
        'quantidade_aceita + quantidade_recusada não pode exceder quantidade_recebida.',
      );
    }
  }
}

export function assertLocalizacoesParaConfirmacao(itens: RecebimentoItemDto[]) {
  for (const item of itens) {
    if ((item.quantidade_aceita || 0) > 0 && !item.localizacao_id) {
      throw new BadRequestException(
        `localizacao_id é obrigatória para confirmar item ${item.pedido_item_id}.`,
      );
    }
  }
}

export function assertSaldosRecebimento(
  itensDto: RecebimentoItemDto[],
  pedidoItens: Array<{
    id: string;
    quantidade: Prisma.Decimal;
    quantidade_recebida: Prisma.Decimal;
  }>,
) {
  const mapa = new Map(pedidoItens.map((i) => [i.id, i]));
  const somaPorItem = new Map<string, number>();

  for (const item of itensDto) {
    const prev = somaPorItem.get(item.pedido_item_id) ?? 0;
    somaPorItem.set(item.pedido_item_id, prev + Number(item.quantidade_aceita));
  }

  for (const [pedidoItemId, somaAceita] of somaPorItem) {
    const pedidoItem = mapa.get(pedidoItemId)!;
    const pendente = saldoPendenteItem(
      Number(pedidoItem.quantidade),
      Number(pedidoItem.quantidade_recebida),
    );
    if (somaAceita - pendente > 1e-9) {
      throw new BadRequestException(
        `Quantidade aceita do item ${pedidoItemId} excede o saldo pendente (${pendente}).`,
      );
    }
  }
}

export async function confirmarRecebimentoNoTx(
  tx: Tx,
  recebimentoId: string,
  lojaId: string,
  usuarioId: string,
) {
  const recebimento = await tx.recebimentoCompra.findFirst({
    where: { id: recebimentoId, loja_id: lojaId },
    include: { itens: true },
  });
  if (!recebimento) {
    throw new NotFoundException('Recebimento não encontrado nesta loja.');
  }
  if (recebimento.status === StatusRecebimentoCompra.CONFIRMADO) {
    return tx.recebimentoCompra.findFirstOrThrow({
      where: { id: recebimentoId },
      include: RECEBIMENTO_INCLUDE,
    });
  }
  if (recebimento.status !== StatusRecebimentoCompra.RASCUNHO) {
    throw new BadRequestException(
      `Não é possível confirmar recebimento em status ${recebimento.status}.`,
    );
  }

  const pedido = await carregarPedidoRecebivel(
    tx,
    recebimento.pedido_id,
    lojaId,
    true,
  );

  const itensDtoLike: RecebimentoItemDto[] = recebimento.itens.map((i) => ({
    pedido_item_id: i.pedido_item_id,
    quantidade_recebida: Number(i.quantidade_recebida),
    quantidade_aceita: Number(i.quantidade_aceita),
    quantidade_recusada: Number(i.quantidade_recusada),
    localizacao_id: i.localizacao_id ?? undefined,
    lote_codigo: i.lote_codigo ?? undefined,
    observacao: i.observacao ?? undefined,
  }));
  assertLocalizacoesParaConfirmacao(itensDtoLike);
  assertSaldosRecebimento(itensDtoLike, pedido.itens);

  const acumuladoRecebido = new Map<string, number>();
  for (const pi of pedido.itens) {
    acumuladoRecebido.set(pi.id, Number(pi.quantidade_recebida));
  }

  for (const item of recebimento.itens) {
    const qtdAceita = Number(item.quantidade_aceita) || 0;
    const pedidoItem = pedido.itens.find((p) => p.id === item.pedido_item_id);
    if (!pedidoItem || !pedidoItem.insumo_id) {
      throw new BadRequestException(
        `Item de pedido ${item.pedido_item_id} inválido para estoque.`,
      );
    }

    let estoqueItemId: string | null = item.estoque_item_id;
    let movimentoRef: string | null = item.movimento_ref;

    if (qtdAceita > 0) {
      const resultado = await registrarEntradaEstoqueRecebimento(tx, {
        lojaId,
        usuarioId,
        recebimentoId: recebimento.id,
        itemId: item.id,
        insumoId: pedidoItem.insumo_id,
        localizacaoId: item.localizacao_id!,
        quantidadeAceita: qtdAceita,
        precoUnitarioPedido: Number(pedidoItem.preco_unitario),
        loteCodigo: item.lote_codigo,
        unidade: pedidoItem.unidade_snapshot,
        nome: pedidoItem.descricao_snapshot,
        observacao: item.observacao,
      });
      estoqueItemId = resultado.estoqueItemId;
      movimentoRef = resultado.movimentoRef;
    }

    await tx.recebimentoCompraItem.update({
      where: { id: item.id },
      data: {
        estoque_item_id: estoqueItemId,
        movimento_ref: movimentoRef,
      },
    });

    const novoRecebido =
      (acumuladoRecebido.get(pedidoItem.id) ?? 0) + qtdAceita;
    acumuladoRecebido.set(pedidoItem.id, novoRecebido);

    await tx.pedidoCompraItem.update({
      where: { id: pedidoItem.id },
      data: { quantidade_recebida: new Prisma.Decimal(novoRecebido) },
    });
  }

  const atualizado = await tx.recebimentoCompra.update({
    where: { id: recebimento.id },
    data: {
      status: StatusRecebimentoCompra.CONFIRMADO,
      movimento_estoque_ok: true,
    },
    include: RECEBIMENTO_INCLUDE,
  });

  await updatePedidoStatusAposEvento(tx, recebimento.pedido_id, lojaId);
  return atualizado;
}

export async function estornarRecebimentoConfirmadoNoTx(
  tx: Tx,
  recebimentoId: string,
  lojaId: string,
  usuarioId: string,
  motivo?: string | null,
) {
  const full = await tx.recebimentoCompra.findFirstOrThrow({
    where: { id: recebimentoId, loja_id: lojaId },
    include: { itens: true },
  });

  for (const item of full.itens) {
    const qtdAceita = Number(item.quantidade_aceita) || 0;
    if (qtdAceita <= 0) continue;

    if (item.estoque_item_id) {
      await registrarEstornoEstoqueRecebimento(tx, {
        lojaId,
        usuarioId,
        recebimentoId: full.id,
        itemId: item.id,
        estoqueItemId: item.estoque_item_id,
        quantidadeAceita: qtdAceita,
        observacao: motivo ?? null,
      });
    }

    const pedidoItem = await tx.pedidoCompraItem.findFirstOrThrow({
      where: { id: item.pedido_item_id, loja_id: lojaId },
    });
    const novaRecebida = Math.max(
      0,
      Number(pedidoItem.quantidade_recebida) - qtdAceita,
    );
    await tx.pedidoCompraItem.update({
      where: { id: pedidoItem.id },
      data: { quantidade_recebida: new Prisma.Decimal(novaRecebida) },
    });
  }

  const updated = await tx.recebimentoCompra.update({
    where: { id: full.id },
    data: {
      status: StatusRecebimentoCompra.ESTORNADO,
      movimento_estoque_ok: false,
    },
    include: RECEBIMENTO_INCLUDE,
  });

  await updatePedidoStatusAposEvento(tx, full.pedido_id, lojaId);
  return updated;
}
