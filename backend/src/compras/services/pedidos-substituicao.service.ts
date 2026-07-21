import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusPedidoCompra, loja } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentCodeService } from '../../documentos/document-code.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { PedidoItemDto } from '../dto/pedido-item.dto';
import { SubstituirFornecedorDto } from '../dto/substituir-fornecedor.dto';
import {
  assertTransicaoPedido,
} from '../policies/compras-estados.policy';
import { ComprasHistoricoService } from './compras-historico.service';
import {
  COMPRAS_PERMISSOES,
  ComprasPermissionsService,
} from './compras-permissions.service';
import {
  carregarFornecedorAtivo,
  assertTipoFornecedorCompativel,
  validarItensPedido,
  validarMatrizInsumoFornecedor,
} from './pedido-matriz.util';
import {
  calcularTotaisPedido,
  rethrowUniqueConflict,
} from './pedido-totais.util';

@Injectable()
export class PedidosSubstituicaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentCode: DocumentCodeService,
    private readonly historicoService: ComprasHistoricoService,
    private readonly permissions: ComprasPermissionsService,
  ) {}

  async substituirFornecedor(
    id: string,
    dto: SubstituirFornecedorDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_SUBSTITUIR_FORNECEDOR,
    );

    const original = await this.prisma.pedidoCompra.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: { itens: true },
    });

    if (!original) {
      throw new NotFoundException(
        `Pedido de compra com ID "${id}" não encontrado.`,
      );
    }

    assertTransicaoPedido('substituivel', original.status);

    if (dto.fornecedor_id === original.fornecedor_id) {
      throw new BadRequestException(
        'O novo fornecedor deve ser diferente do fornecedor atual.',
      );
    }

    const fornecedor = await carregarFornecedorAtivo(
      this.prisma,
      dto.fornecedor_id,
      lojaAtual.id,
    );

    const itensDto = dto.itens?.length
      ? dto.itens
      : this.copiarItensRestantes(original.itens);

    validarItensPedido(itensDto);
    assertTipoFornecedorCompativel(fornecedor.tipo, itensDto);

    const matriz = await validarMatrizInsumoFornecedor(
      this.prisma,
      lojaAtual.id,
      dto.fornecedor_id,
      itensDto,
      dto.fornecedor_fora_matriz_justificativa,
    );

    const baseDto: CreatePedidoDto = {
      fornecedor_id: dto.fornecedor_id,
      moeda: original.moeda,
      desconto: Number(original.desconto),
      frete: Number(original.frete),
      data_prevista: original.data_prevista
        ? original.data_prevista.toISOString()
        : undefined,
      condicao_pagamento: original.condicao_pagamento ?? undefined,
      observacoes: original.observacoes ?? undefined,
      itens: itensDto,
      fornecedor_fora_matriz_justificativa:
        dto.fornecedor_fora_matriz_justificativa,
    };

    const { itens, subtotal, total, desconto, frete } = calcularTotaisPedido(
      baseDto,
      lojaAtual.id,
    );

    const motivo = dto.motivo.trim();
    const agora = new Date();

    try {
      const numero = await this.documentCode.gerarCodigoPedidoCompra(
        lojaAtual.id,
      );

      const novo = await this.prisma.$transaction(async (tx) => {
        const cancelado = await tx.pedidoCompra.updateMany({
          where: {
            id: original.id,
            loja_id: lojaAtual.id,
            status: original.status,
          },
          data: {
            status: StatusPedidoCompra.CANCELADO,
            cancelado_em: agora,
            cancelado_por: usuarioId,
            motivo_cancelamento: motivo,
          },
        });

        if (cancelado.count !== 1) {
          throw new BadRequestException(
            'Não foi possível cancelar o pedido original (status alterado).',
          );
        }

        return tx.pedidoCompra.create({
          data: {
            loja_id: lojaAtual.id,
            numero,
            fornecedor_id: dto.fornecedor_id,
            status: StatusPedidoCompra.RASCUNHO,
            pedido_substituido_id: original.id,
            motivo_substituicao: motivo,
            moeda: original.moeda,
            subtotal,
            desconto,
            frete,
            total,
            data_prevista: original.data_prevista,
            condicao_pagamento: original.condicao_pagamento,
            observacoes: original.observacoes,
            itens: { create: itens },
          },
          include: {
            itens: true,
            fornecedor: {
              select: { id: true, nome: true, ativo: true, tipo: true },
            },
          },
        });
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'PEDIDO_COMPRA',
        entidadeId: original.id,
        acao: 'CANCELAR_POR_SUBSTITUICAO',
        statusAnterior: original.status,
        statusNovo: StatusPedidoCompra.CANCELADO,
        usuarioId,
        dados: {
          motivo,
          pedido_substituto_id: novo.id,
          permissao: COMPRAS_PERMISSOES.PEDIDO_SUBSTITUIR_FORNECEDOR,
        },
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'PEDIDO_COMPRA',
        entidadeId: novo.id,
        acao: 'SUBSTITUIR_FORNECEDOR',
        statusAnterior: null,
        statusNovo: StatusPedidoCompra.RASCUNHO,
        usuarioId,
        dados: {
          motivo,
          pedido_substituido_id: original.id,
          fornecedor_anterior_id: original.fornecedor_id,
          fornecedor_id: dto.fornecedor_id,
          ...(matriz.foraDaMatriz
            ? {
                fornecedor_fora_matriz: true,
                insumos_fora_matriz: matriz.insumosFora,
                fornecedor_fora_matriz_justificativa: matriz.justificativa,
              }
            : {}),
          permissao: COMPRAS_PERMISSOES.PEDIDO_SUBSTITUIR_FORNECEDOR,
        },
      });

      return novo;
    } catch (error) {
      rethrowUniqueConflict(
        error,
        'Já existe um pedido com este número nesta loja.',
      );
      throw error;
    }
  }

  /** Itens com quantidade ainda pendente (não totalmente recebida). */
  private copiarItensRestantes(
    itens: Array<{
      tipo: PedidoItemDto['tipo'];
      solicitacao_item_id: string | null;
      insumo_id: string | null;
      ordem_terceirizacao_id: string | null;
      descricao_snapshot: string;
      codigo_ref_snapshot: string | null;
      quantidade: { toString(): string } | number;
      unidade_snapshot: string;
      preco_unitario: { toString(): string } | number;
      desconto: { toString(): string } | number;
      frete_rateado: { toString(): string } | number;
      quantidade_recebida: { toString(): string } | number;
    }>,
  ): PedidoItemDto[] {
    const restantes: PedidoItemDto[] = [];

    for (const item of itens) {
      const qtd = Number(item.quantidade);
      const recebida = Number(item.quantidade_recebida);
      const restante = qtd - recebida;
      if (restante <= 0) {
        continue;
      }

      restantes.push({
        tipo: item.tipo,
        solicitacao_item_id: item.solicitacao_item_id ?? undefined,
        insumo_id: item.insumo_id ?? undefined,
        ordem_terceirizacao_id: item.ordem_terceirizacao_id ?? undefined,
        descricao_snapshot: item.descricao_snapshot,
        codigo_ref_snapshot: item.codigo_ref_snapshot ?? undefined,
        quantidade: restante,
        unidade_snapshot: item.unidade_snapshot,
        preco_unitario: Number(item.preco_unitario),
        desconto: Number(item.desconto),
        frete_rateado: Number(item.frete_rateado),
      });
    }

    if (!restantes.length) {
      throw new BadRequestException(
        'Não há itens restantes para substituir neste pedido.',
      );
    }

    return restantes;
  }
}
