import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  TipoFornecedor,
  TipoItemCompra,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PedidoItemDto } from '../dto/pedido-item.dto';

export type FornecedorPedidoInfo = {
  id: string;
  ativo: boolean;
  tipo: TipoFornecedor;
  nome: string;
};

export type MatrizValidacaoResultado = {
  foraDaMatriz: boolean;
  insumosFora: string[];
  justificativa?: string;
};

export async function carregarFornecedorAtivo(
  prisma: PrismaService,
  fornecedorId: string,
  lojaId: string,
): Promise<FornecedorPedidoInfo> {
  const fornecedor = await prisma.fornecedor.findFirst({
    where: { id: fornecedorId, loja_id: lojaId },
    select: { id: true, ativo: true, tipo: true, nome: true },
  });

  if (!fornecedor) {
    throw new BadRequestException(
      `Fornecedor "${fornecedorId}" não encontrado nesta loja.`,
    );
  }

  if (!fornecedor.ativo) {
    throw new BadRequestException(
      'O fornecedor precisa estar ativo para emitir o pedido.',
    );
  }

  return fornecedor;
}

/**
 * MATERIAL → INSUMO|AMBOS; SERVICO → TERCEIRIZADO|AMBOS; DESPESA → qualquer ativo.
 */
export function assertTipoFornecedorCompativel(
  tipoFornecedor: TipoFornecedor,
  itens: PedidoItemDto[],
): void {
  const tiposItem = new Set(itens.map((i) => i.tipo));

  if (tiposItem.has(TipoItemCompra.MATERIAL)) {
    if (
      tipoFornecedor !== TipoFornecedor.INSUMO &&
      tipoFornecedor !== TipoFornecedor.AMBOS
    ) {
      throw new BadRequestException(
        'Itens MATERIAL exigem fornecedor do tipo INSUMO ou AMBOS.',
      );
    }
  }

  if (tiposItem.has(TipoItemCompra.SERVICO)) {
    if (
      tipoFornecedor !== TipoFornecedor.TERCEIRIZADO &&
      tipoFornecedor !== TipoFornecedor.AMBOS
    ) {
      throw new BadRequestException(
        'Itens SERVICO exigem fornecedor do tipo TERCEIRIZADO ou AMBOS.',
      );
    }
  }
}

export function validarItensPedido(itens: PedidoItemDto[]): void {
  if (!itens?.length) {
    throw new BadRequestException('Informe ao menos um item no pedido.');
  }

  for (const item of itens) {
    if (item.tipo === TipoItemCompra.MATERIAL && !item.insumo_id) {
      throw new BadRequestException('Itens MATERIAL exigem insumo_id.');
    }
    if (
      (item.tipo === TipoItemCompra.SERVICO ||
        item.tipo === TipoItemCompra.DESPESA) &&
      !item.descricao_snapshot?.trim()
    ) {
      throw new BadRequestException(
        'Itens SERVICO/DESPESA exigem descricao_snapshot.',
      );
    }
  }
}

/**
 * Para cada MATERIAL com insumo_id, exige vínculo em InsumoFornecedor
 * ou justificativa não vazia (fornecedor fora da matriz).
 */
export async function validarMatrizInsumoFornecedor(
  prisma: PrismaService,
  lojaId: string,
  fornecedorId: string,
  itens: PedidoItemDto[],
  justificativa?: string,
): Promise<MatrizValidacaoResultado> {
  const insumosMaterial = [
    ...new Set(
      itens
        .filter(
          (i) => i.tipo === TipoItemCompra.MATERIAL && Boolean(i.insumo_id),
        )
        .map((i) => i.insumo_id as string),
    ),
  ];

  if (insumosMaterial.length === 0) {
    return { foraDaMatriz: false, insumosFora: [] };
  }

  const vinculos = await prisma.insumoFornecedor.findMany({
    where: {
      loja_id: lojaId,
      fornecedor_id: fornecedorId,
      insumo_id: { in: insumosMaterial },
    },
    select: { insumo_id: true },
  });

  const cobertos = new Set(vinculos.map((v) => v.insumo_id));
  const insumosFora = insumosMaterial.filter((id) => !cobertos.has(id));

  if (insumosFora.length === 0) {
    return { foraDaMatriz: false, insumosFora: [] };
  }

  const justificativaTrim = justificativa?.trim();
  if (!justificativaTrim) {
    throw new BadRequestException(
      'Um ou mais insumos MATERIAL não estão na matriz deste fornecedor. Informe fornecedor_fora_matriz_justificativa.',
    );
  }

  return {
    foraDaMatriz: true,
    insumosFora,
    justificativa: justificativaTrim,
  };
}

/**
 * updateMany com loja_id + checagem count === 1 (tenant-safe).
 */
export async function updatePedidoTenantSafe(
  prisma: PrismaService,
  id: string,
  lojaId: string,
  data: Prisma.PedidoCompraUpdateManyMutationInput,
): Promise<void> {
  const result = await prisma.pedidoCompra.updateMany({
    where: { id, loja_id: lojaId },
    data,
  });
  if (result.count !== 1) {
    throw new NotFoundException(
      `Pedido de compra com ID "${id}" não encontrado.`,
    );
  }
}

export async function updateSolicitacaoTenantSafe(
  prisma: PrismaService,
  id: string,
  lojaId: string,
  data: Prisma.SolicitacaoCompraUpdateManyMutationInput,
): Promise<void> {
  const result = await prisma.solicitacaoCompra.updateMany({
    where: { id, loja_id: lojaId },
    data,
  });
  if (result.count !== 1) {
    throw new NotFoundException(
      `Solicitação de compra com ID "${id}" não encontrada.`,
    );
  }
}
