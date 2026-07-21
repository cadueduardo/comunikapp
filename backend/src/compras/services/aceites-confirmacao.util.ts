import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  StatusAceiteServico,
  StatusPedidoCompra,
  TipoItemCompra,
} from '@prisma/client';
import { AceiteServicoItemDto } from '../dto/create-aceite-servico.dto';
import {
  saldoPendenteItem,
  updatePedidoStatusAposEvento,
} from './pedido-status-rollup.util';

type Tx = Prisma.TransactionClient;

type PedidoReader = {
  pedidoCompra: {
    findFirst: Tx['pedidoCompra']['findFirst'];
  };
};

export const ACEITE_INCLUDE = {
  itens: true,
  pedido: { select: { id: true, numero: true, status: true } },
  responsavel: {
    select: { id: true, nome_completo: true, email: true },
  },
} as const;

export const STATUS_PEDIDO_ACEITAVEL: StatusPedidoCompra[] = [
  StatusPedidoCompra.ENVIADO,
  StatusPedidoCompra.PARCIAL,
  StatusPedidoCompra.APROVADO,
  StatusPedidoCompra.ATENDIDO,
];

export function resolverQuantidadeAceiteItem(
  item: {
    quantidade_aceita?: number | Prisma.Decimal | null;
    percentual_aceito?: number | Prisma.Decimal | null;
    valor_aceito?: number | Prisma.Decimal | null;
  },
  pedidoItem: {
    quantidade: Prisma.Decimal | number;
    total: Prisma.Decimal | number;
  } | null,
): number {
  if (item.quantidade_aceita != null) {
    return Number(item.quantidade_aceita) || 0;
  }
  if (item.percentual_aceito != null && pedidoItem) {
    return (
      (Number(pedidoItem.quantidade) * Number(item.percentual_aceito)) / 100
    );
  }
  if (item.valor_aceito != null && pedidoItem) {
    const total = Number(pedidoItem.total) || 0;
    if (total <= 0) return 0;
    return (Number(pedidoItem.quantidade) * Number(item.valor_aceito)) / total;
  }
  return 0;
}

export async function carregarPedidoAceitavel(
  db: PedidoReader,
  pedidoId: string,
  lojaId: string,
) {
  const pedido = await db.pedidoCompra.findFirst({
    where: { id: pedidoId, loja_id: lojaId },
    include: { itens: true },
  });
  if (!pedido) {
    throw new NotFoundException('Pedido não encontrado nesta loja.');
  }
  if (!STATUS_PEDIDO_ACEITAVEL.includes(pedido.status)) {
    throw new BadRequestException(
      `Pedido em status ${pedido.status} não permite aceite de serviço.`,
    );
  }
  return pedido;
}

export function validarItensAceite(
  itensDto: AceiteServicoItemDto[],
  pedidoItens: Array<{
    id: string;
    tipo: TipoItemCompra;
    quantidade: Prisma.Decimal;
    total: Prisma.Decimal;
  }>,
) {
  const mapa = new Map(pedidoItens.map((i) => [i.id, i]));
  for (const item of itensDto) {
    const pedidoItem = mapa.get(item.pedido_item_id);
    if (!pedidoItem) {
      throw new BadRequestException(
        `Item ${item.pedido_item_id} não pertence ao pedido.`,
      );
    }
    if (pedidoItem.tipo !== TipoItemCompra.SERVICO) {
      throw new BadRequestException(
        `Item ${item.pedido_item_id} não é SERVICO; use recebimento de material.`,
      );
    }
    const qtd = resolverQuantidadeAceiteItem(item, pedidoItem);
    if (qtd <= 0) {
      throw new BadRequestException(
        `Informe quantidade_aceita, percentual_aceito ou valor_aceito para o item ${item.pedido_item_id}.`,
      );
    }
  }
}

export function assertSaldosAceite(
  itensDto: AceiteServicoItemDto[],
  pedidoItens: Array<{
    id: string;
    quantidade: Prisma.Decimal;
    quantidade_aceita: Prisma.Decimal;
    total: Prisma.Decimal;
  }>,
) {
  const mapa = new Map(pedidoItens.map((i) => [i.id, i]));
  const soma = new Map<string, number>();

  for (const item of itensDto) {
    const pedidoItem = mapa.get(item.pedido_item_id)!;
    const qtd = resolverQuantidadeAceiteItem(item, pedidoItem);
    soma.set(item.pedido_item_id, (soma.get(item.pedido_item_id) ?? 0) + qtd);
  }

  for (const [pedidoItemId, somaAceita] of soma) {
    const pedidoItem = mapa.get(pedidoItemId)!;
    const pendente = saldoPendenteItem(
      Number(pedidoItem.quantidade),
      Number(pedidoItem.quantidade_aceita),
    );
    if (somaAceita - pendente > 1e-9) {
      throw new BadRequestException(
        `Quantidade aceita do item ${pedidoItemId} excede o saldo pendente (${pendente}).`,
      );
    }
  }
}

export async function confirmarAceiteNoTx(
  tx: Tx,
  aceiteId: string,
  lojaId: string,
) {
  const aceite = await tx.aceiteServico.findFirst({
    where: { id: aceiteId, loja_id: lojaId },
    include: { itens: true },
  });
  if (!aceite) {
    throw new NotFoundException('Aceite de serviço não encontrado nesta loja.');
  }
  if (aceite.status === StatusAceiteServico.CONFIRMADO) {
    return tx.aceiteServico.findFirstOrThrow({
      where: { id: aceiteId },
      include: ACEITE_INCLUDE,
    });
  }
  if (aceite.status !== StatusAceiteServico.RASCUNHO) {
    throw new BadRequestException(
      `Não é possível confirmar aceite em status ${aceite.status}.`,
    );
  }

  const pedido = await carregarPedidoAceitavel(tx, aceite.pedido_id, lojaId);

  const itensDto: AceiteServicoItemDto[] = aceite.itens.map((i) => ({
    pedido_item_id: i.pedido_item_id,
    quantidade_aceita:
      i.quantidade_aceita != null ? Number(i.quantidade_aceita) : undefined,
    percentual_aceito:
      i.percentual_aceito != null ? Number(i.percentual_aceito) : undefined,
    valor_aceito: i.valor_aceito != null ? Number(i.valor_aceito) : undefined,
  }));
  assertSaldosAceite(itensDto, pedido.itens);

  const acumulado = new Map<string, number>();
  for (const pi of pedido.itens) {
    acumulado.set(pi.id, Number(pi.quantidade_aceita));
  }

  for (const item of aceite.itens) {
    const pedidoItem = pedido.itens.find((p) => p.id === item.pedido_item_id)!;
    const qtd = resolverQuantidadeAceiteItem(item, pedidoItem);
    if (qtd <= 0) continue;

    const atual = acumulado.get(pedidoItem.id) ?? 0;
    const novo = atual + qtd;
    acumulado.set(pedidoItem.id, novo);

    await tx.pedidoCompraItem.update({
      where: { id: pedidoItem.id },
      data: { quantidade_aceita: new Prisma.Decimal(novo) },
    });
  }

  const atualizado = await tx.aceiteServico.update({
    where: { id: aceite.id },
    data: { status: StatusAceiteServico.CONFIRMADO },
    include: ACEITE_INCLUDE,
  });

  await updatePedidoStatusAposEvento(tx, aceite.pedido_id, lojaId);
  return atualizado;
}

export async function estornarAceiteConfirmadoNoTx(
  tx: Tx,
  aceiteId: string,
  lojaId: string,
) {
  const full = await tx.aceiteServico.findFirstOrThrow({
    where: { id: aceiteId, loja_id: lojaId },
    include: { itens: true },
  });

  for (const item of full.itens) {
    const pedidoItem = await tx.pedidoCompraItem.findFirstOrThrow({
      where: { id: item.pedido_item_id, loja_id: lojaId },
    });
    const qtd = resolverQuantidadeAceiteItem(item, pedidoItem);
    if (qtd <= 0) continue;

    const nova = Math.max(0, Number(pedidoItem.quantidade_aceita) - qtd);
    await tx.pedidoCompraItem.update({
      where: { id: pedidoItem.id },
      data: { quantidade_aceita: new Prisma.Decimal(nova) },
    });
  }

  const updated = await tx.aceiteServico.update({
    where: { id: full.id },
    data: { status: StatusAceiteServico.ESTORNADO },
    include: ACEITE_INCLUDE,
  });

  await updatePedidoStatusAposEvento(tx, full.pedido_id, lojaId);
  return updated;
}
