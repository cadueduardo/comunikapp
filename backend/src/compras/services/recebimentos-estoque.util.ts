import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma, estoque_movimentacoes_tipo } from '@prisma/client';
import { randomUUID } from 'crypto';

type Tx = Prisma.TransactionClient;

/**
 * Custo médio ponderado D1:
 * novo = ((qtd * preco) + (entrada * preco_item)) / (qtd + entrada)
 */
export function calcularCustoMedioPonderado(
  quantidadeAtual: number,
  precoAtual: number,
  quantidadeEntrada: number,
  precoEntrada: number,
): number {
  const qtd = Number(quantidadeAtual) || 0;
  const preco = Number(precoAtual) || 0;
  const entrada = Number(quantidadeEntrada) || 0;
  const precoItem = Number(precoEntrada) || 0;

  if (entrada <= 0) {
    return preco;
  }

  const denominador = qtd + entrada;
  if (denominador <= 0) {
    return precoItem;
  }

  return (qtd * preco + entrada * precoItem) / denominador;
}

export function documentoRefRecebimento(
  recebimentoId: string,
  itemId: string,
): string {
  return `COMPRA-RC:${recebimentoId}:${itemId}`;
}

export function documentoRefEstornoRecebimento(
  recebimentoId: string,
  itemId: string,
): string {
  return `COMPRA-RC-ESTORNO:${recebimentoId}:${itemId}`;
}

async function assertLocalizacaoDaLoja(
  tx: Tx,
  lojaId: string,
  localizacaoId: string,
): Promise<void> {
  const loc = await tx.estoque_localizacoes.findFirst({
    where: { id: localizacaoId, lojaId },
    select: { id: true },
  });
  if (!loc) {
    throw new BadRequestException(
      `Localização de estoque "${localizacaoId}" não encontrada nesta loja.`,
    );
  }
}

async function findOrCreateEstoqueItem(
  tx: Tx,
  params: {
    lojaId: string;
    insumoId: string;
    localizacaoId: string;
    loteCodigo?: string | null;
    unidade?: string | null;
    nome?: string | null;
  },
): Promise<{ id: string; quantidadeAtual: Prisma.Decimal; precoUnitario: Prisma.Decimal | null }> {
  await assertLocalizacaoDaLoja(tx, params.lojaId, params.localizacaoId);

  const existente = await tx.estoque_itens.findFirst({
    where: {
      lojaId: params.lojaId,
      insumoId: params.insumoId,
      localizacaoId: params.localizacaoId,
    },
  });

  if (existente) {
    return existente;
  }

  return tx.estoque_itens.create({
    data: {
      id: randomUUID(),
      lojaId: params.lojaId,
      insumoId: params.insumoId,
      localizacaoId: params.localizacaoId,
      quantidadeAtual: 0,
      quantidadeReservada: 0,
      estoqueMinimo: 0,
      unidadeMedida: params.unidade ?? null,
      nome: params.nome ?? null,
      lote: params.loteCodigo ?? null,
      ativo: true,
    },
  });
}

async function assertDocumentoRefLivre(
  tx: Tx,
  lojaId: string,
  documentoRef: string,
): Promise<void> {
  const existente = await tx.estoque_movimentacoes.findFirst({
    where: { lojaId, documentoRef },
    select: { id: true },
  });
  if (existente) {
    throw new ConflictException(
      `Movimentação de estoque já existe para referência "${documentoRef}".`,
    );
  }
}

/**
 * Entrada de estoque por item de recebimento confirmado.
 * Usa Prisma (camelCase) + id UUID; não chama MovimentacoesService.
 */
export async function registrarEntradaEstoqueRecebimento(
  tx: Tx,
  params: {
    lojaId: string;
    usuarioId: string;
    recebimentoId: string;
    itemId: string;
    insumoId: string;
    localizacaoId: string;
    quantidadeAceita: number;
    precoUnitarioPedido: number;
    loteCodigo?: string | null;
    unidade?: string | null;
    nome?: string | null;
    observacao?: string | null;
  },
): Promise<{ estoqueItemId: string; movimentoRef: string }> {
  if (params.quantidadeAceita <= 0) {
    throw new BadRequestException(
      'quantidade_aceita deve ser maior que zero para entrada de estoque.',
    );
  }
  if (!params.localizacaoId) {
    throw new BadRequestException(
      'localizacao_id é obrigatória na confirmação do recebimento de material.',
    );
  }

  const documentoRef = documentoRefRecebimento(
    params.recebimentoId,
    params.itemId,
  );
  await assertDocumentoRefLivre(tx, params.lojaId, documentoRef);

  const estoque = await findOrCreateEstoqueItem(tx, {
    lojaId: params.lojaId,
    insumoId: params.insumoId,
    localizacaoId: params.localizacaoId,
    loteCodigo: params.loteCodigo,
    unidade: params.unidade,
    nome: params.nome,
  });

  const qtdAnterior = Number(estoque.quantidadeAtual) || 0;
  const precoAnterior = Number(estoque.precoUnitario) || 0;
  const qtdPosterior = qtdAnterior + params.quantidadeAceita;
  const novoPreco = calcularCustoMedioPonderado(
    qtdAnterior,
    precoAnterior,
    params.quantidadeAceita,
    params.precoUnitarioPedido,
  );

  await tx.estoque_itens.update({
    where: { id: estoque.id },
    data: {
      quantidadeAtual: qtdPosterior,
      precoUnitario: new Prisma.Decimal(novoPreco.toFixed(2)),
      dataUltimaMov: new Date(),
      ...(params.loteCodigo ? { lote: params.loteCodigo } : {}),
    },
  });

  await tx.estoque_movimentacoes.create({
    data: {
      id: randomUUID(),
      lojaId: params.lojaId,
      estoqueId: estoque.id,
      tipo: estoque_movimentacoes_tipo.ENTRADA,
      quantidade: params.quantidadeAceita,
      quantidadeAnterior: qtdAnterior,
      quantidadePosterior: qtdPosterior,
      documentoRef,
      usuarioId: params.usuarioId,
      observacoes: params.observacao ?? null,
    },
  });

  return { estoqueItemId: estoque.id, movimentoRef: documentoRef };
}

/**
 * Estorno: saída espelhando a entrada CONFIRMADA.
 */
export async function registrarEstornoEstoqueRecebimento(
  tx: Tx,
  params: {
    lojaId: string;
    usuarioId: string;
    recebimentoId: string;
    itemId: string;
    estoqueItemId: string;
    quantidadeAceita: number;
    observacao?: string | null;
  },
): Promise<string> {
  if (params.quantidadeAceita <= 0) {
    return '';
  }

  const documentoRef = documentoRefEstornoRecebimento(
    params.recebimentoId,
    params.itemId,
  );
  await assertDocumentoRefLivre(tx, params.lojaId, documentoRef);

  const estoque = await tx.estoque_itens.findFirst({
    where: { id: params.estoqueItemId, lojaId: params.lojaId },
  });
  if (!estoque) {
    throw new BadRequestException(
      `Item de estoque "${params.estoqueItemId}" não encontrado para estorno.`,
    );
  }

  const qtdAnterior = Number(estoque.quantidadeAtual) || 0;
  const qtdPosterior = qtdAnterior - params.quantidadeAceita;
  if (qtdPosterior < -1e-9) {
    throw new BadRequestException(
      'Saldo de estoque insuficiente para estornar o recebimento.',
    );
  }

  await tx.estoque_itens.update({
    where: { id: estoque.id },
    data: {
      quantidadeAtual: Math.max(0, qtdPosterior),
      dataUltimaMov: new Date(),
    },
  });

  await tx.estoque_movimentacoes.create({
    data: {
      id: randomUUID(),
      lojaId: params.lojaId,
      estoqueId: estoque.id,
      tipo: estoque_movimentacoes_tipo.SAIDA,
      quantidade: params.quantidadeAceita,
      quantidadeAnterior: qtdAnterior,
      quantidadePosterior: Math.max(0, qtdPosterior),
      documentoRef,
      usuarioId: params.usuarioId,
      observacoes: params.observacao ?? 'Estorno de recebimento de compra',
    },
  });

  return documentoRef;
}
