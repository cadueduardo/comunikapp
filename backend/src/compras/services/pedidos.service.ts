import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusPedidoCompra, loja } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentCodeService } from '../../documentos/document-code.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/update-pedido.dto';
import { PedidoItemDto } from '../dto/pedido-item.dto';
import { ComprasHistoricoService } from './compras-historico.service';
import {
  COMPRAS_PERMISSOES,
  COMPRAS_PERMISSOES_LEITURA_PEDIDO,
  ComprasPermissionsService,
} from './compras-permissions.service';
import {
  assertTipoFornecedorCompativel,
  carregarFornecedorAtivo,
  MatrizValidacaoResultado,
  validarItensPedido,
  validarMatrizInsumoFornecedor,
} from './pedido-matriz.util';
import {
  calcularTotaisPedido,
  rethrowUniqueConflict,
} from './pedido-totais.util';

const PEDIDO_INCLUDE = {
  itens: true,
  fornecedor: {
    select: { id: true, nome: true, ativo: true, tipo: true },
  },
} as const;

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentCode: DocumentCodeService,
    private readonly historicoService: ComprasHistoricoService,
    private readonly permissions: ComprasPermissionsService,
  ) {}

  async create(dto: CreatePedidoDto, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_CRIAR,
    );

    validarItensPedido(dto.itens);
    const fornecedor = await carregarFornecedorAtivo(
      this.prisma,
      dto.fornecedor_id,
      lojaAtual.id,
    );
    assertTipoFornecedorCompativel(fornecedor.tipo, dto.itens);

    const matriz = await validarMatrizInsumoFornecedor(
      this.prisma,
      lojaAtual.id,
      dto.fornecedor_id,
      dto.itens,
      dto.fornecedor_fora_matriz_justificativa,
    );

    const { itens, subtotal, total, desconto, frete } = calcularTotaisPedido(
      dto,
      lojaAtual.id,
    );

    try {
      const numero = await this.documentCode.gerarCodigoPedidoCompra(
        lojaAtual.id,
      );

      const criado = await this.prisma.pedidoCompra.create({
        data: {
          loja_id: lojaAtual.id,
          numero,
          fornecedor_id: dto.fornecedor_id,
          status: StatusPedidoCompra.RASCUNHO,
          moeda: dto.moeda?.trim().toUpperCase() || 'BRL',
          subtotal,
          desconto,
          frete,
          total,
          data_prevista: dto.data_prevista
            ? new Date(dto.data_prevista)
            : undefined,
          condicao_pagamento: dto.condicao_pagamento,
          observacoes: dto.observacoes,
          itens: {
            create: itens,
          },
        },
        include: PEDIDO_INCLUDE,
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'PEDIDO_COMPRA',
        entidadeId: criado.id,
        acao: 'CRIAR',
        statusAnterior: null,
        statusNovo: StatusPedidoCompra.RASCUNHO,
        usuarioId,
        dados: {
          numero: criado.numero,
          fornecedor_id: criado.fornecedor_id,
          total: Number(criado.total),
          itens: criado.itens.length,
          ...this.dadosMatrizHistorico(matriz),
        },
      });

      return criado;
    } catch (error) {
      rethrowUniqueConflict(
        error,
        'Já existe um pedido com este número nesta loja.',
      );
      throw error;
    }
  }

  async findAll(lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPodeQualquer(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES_LEITURA_PEDIDO,
      'listar pedidos de compra',
    );
    return this.prisma.pedidoCompra.findMany({
      where: { loja_id: lojaAtual.id },
      orderBy: { criado_em: 'desc' },
      include: PEDIDO_INCLUDE,
    });
  }

  async findOne(id: string, lojaAtual: loja, usuarioId?: string) {
    if (usuarioId) {
      await this.permissions.assertPodeQualquer(
        usuarioId,
        lojaAtual.id,
        COMPRAS_PERMISSOES_LEITURA_PEDIDO,
        'consultar pedidos de compra',
      );
    }
    const pedido = await this.prisma.pedidoCompra.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: PEDIDO_INCLUDE,
    });

    if (!pedido) {
      throw new NotFoundException(
        `Pedido de compra com ID "${id}" não encontrado.`,
      );
    }

    return pedido;
  }

  async visualizacao(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPodeQualquer(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES_LEITURA_PEDIDO,
      'consultar pedidos de compra',
    );
    const pedido = await this.prisma.pedidoCompra.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: {
        itens: true,
        fornecedor: true,
      },
    });

    if (!pedido) {
      throw new NotFoundException(
        `Pedido de compra com ID "${id}" não encontrado.`,
      );
    }

    return {
      loja: {
        id: lojaAtual.id,
        nome: lojaAtual.nome,
      },
      pedido,
      fornecedor: pedido.fornecedor,
      itens: pedido.itens,
    };
  }

  async update(
    id: string,
    dto: UpdatePedidoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_CRIAR,
    );

    const atual = await this.findOne(id, lojaAtual);

    if (atual.status !== StatusPedidoCompra.RASCUNHO) {
      throw new BadRequestException(
        'Somente pedidos em RASCUNHO podem ser editados.',
      );
    }

    const fornecedorId = dto.fornecedor_id ?? atual.fornecedor_id;
    const fornecedor = await carregarFornecedorAtivo(
      this.prisma,
      fornecedorId,
      lojaAtual.id,
    );

    const itensDto: PedidoItemDto[] =
      dto.itens ??
      atual.itens.map((item) => ({
        tipo: item.tipo,
        solicitacao_item_id: item.solicitacao_item_id ?? undefined,
        insumo_id: item.insumo_id ?? undefined,
        ordem_terceirizacao_id: item.ordem_terceirizacao_id ?? undefined,
        descricao_snapshot: item.descricao_snapshot,
        codigo_ref_snapshot: item.codigo_ref_snapshot ?? undefined,
        quantidade: Number(item.quantidade),
        unidade_snapshot: item.unidade_snapshot,
        preco_unitario: Number(item.preco_unitario),
        desconto: Number(item.desconto),
        frete_rateado: Number(item.frete_rateado),
      }));

    validarItensPedido(itensDto);
    assertTipoFornecedorCompativel(fornecedor.tipo, itensDto);

    const matriz = await validarMatrizInsumoFornecedor(
      this.prisma,
      lojaAtual.id,
      fornecedorId,
      itensDto,
      dto.fornecedor_fora_matriz_justificativa,
    );

    const baseDto: CreatePedidoDto = {
      fornecedor_id: fornecedorId,
      moeda: dto.moeda ?? atual.moeda,
      desconto:
        dto.desconto !== undefined ? dto.desconto : Number(atual.desconto),
      frete: dto.frete !== undefined ? dto.frete : Number(atual.frete),
      data_prevista: dto.data_prevista,
      condicao_pagamento: dto.condicao_pagamento,
      observacoes: dto.observacoes,
      itens: itensDto,
    };

    const { itens, subtotal, total, desconto, frete } = calcularTotaisPedido(
      baseDto,
      lojaAtual.id,
    );

    try {
      // Tenant já confirmado via findOne(loja_id); update por id após findFirst.
      const atualizado = await this.prisma.$transaction(async (tx) => {
        await tx.pedidoCompraItem.deleteMany({
          where: { pedido_id: id, loja_id: lojaAtual.id },
        });

        return tx.pedidoCompra.update({
          where: { id },
          data: {
            fornecedor_id: fornecedorId,
            ...(dto.moeda !== undefined
              ? { moeda: dto.moeda.trim().toUpperCase() }
              : {}),
            subtotal,
            desconto,
            frete,
            total,
            ...(dto.data_prevista !== undefined
              ? {
                  data_prevista: dto.data_prevista
                    ? new Date(dto.data_prevista)
                    : null,
                }
              : {}),
            ...(dto.condicao_pagamento !== undefined
              ? { condicao_pagamento: dto.condicao_pagamento }
              : {}),
            ...(dto.observacoes !== undefined
              ? { observacoes: dto.observacoes }
              : {}),
            itens: {
              create: itens,
            },
          },
          include: PEDIDO_INCLUDE,
        });
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'PEDIDO_COMPRA',
        entidadeId: id,
        acao: 'ATUALIZAR',
        statusAnterior: atual.status,
        statusNovo: atualizado.status,
        usuarioId,
        dados: {
          campos: Object.keys(dto),
          total: Number(total),
          ...this.dadosMatrizHistorico(matriz),
        },
      });

      return atualizado;
    } catch (error) {
      rethrowUniqueConflict(error, 'Conflito ao atualizar o pedido.');
      throw error;
    }
  }

  async historico(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPodeQualquer(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES_LEITURA_PEDIDO,
      'consultar histórico de pedidos',
    );
    await this.findOne(id, lojaAtual);
    return this.historicoService.listarPorEntidade(
      lojaAtual.id,
      'PEDIDO_COMPRA',
      id,
    );
  }

  private dadosMatrizHistorico(matriz: MatrizValidacaoResultado) {
    if (!matriz.foraDaMatriz) {
      return {};
    }
    return {
      fornecedor_fora_matriz: true,
      insumos_fora_matriz: matriz.insumosFora,
      fornecedor_fora_matriz_justificativa: matriz.justificativa,
    };
  }
}
