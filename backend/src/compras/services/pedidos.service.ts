import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  StatusPedidoCompra,
  TipoItemCompra,
  loja,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentCodeService } from '../../documentos/document-code.service';
import { CreatePedidoDto } from '../dto/create-pedido.dto';
import { UpdatePedidoDto } from '../dto/update-pedido.dto';
import { PedidoItemDto } from '../dto/pedido-item.dto';
import { ComprasHistoricoService } from './compras-historico.service';
import {
  COMPRAS_PERMISSOES,
  ComprasPermissionsService,
} from './compras-permissions.service';
import {
  calcularTotaisPedido,
  rethrowUniqueConflict,
} from './pedido-totais.util';

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

    await this.assertFornecedorAtivo(dto.fornecedor_id, lojaAtual.id);
    this.validarItens(dto.itens);

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
        include: {
          itens: true,
          fornecedor: {
            select: { id: true, nome: true, ativo: true },
          },
        },
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

  async findAll(lojaAtual: loja) {
    return this.prisma.pedidoCompra.findMany({
      where: { loja_id: lojaAtual.id },
      orderBy: { criado_em: 'desc' },
      include: {
        itens: true,
        fornecedor: {
          select: { id: true, nome: true, ativo: true },
        },
      },
    });
  }

  async findOne(id: string, lojaAtual: loja) {
    const pedido = await this.prisma.pedidoCompra.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: {
        itens: true,
        fornecedor: {
          select: { id: true, nome: true, ativo: true },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException(
        `Pedido de compra com ID "${id}" não encontrado.`,
      );
    }

    return pedido;
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
    if (dto.fornecedor_id) {
      await this.assertFornecedorAtivo(dto.fornecedor_id, lojaAtual.id);
    }

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

    this.validarItens(itensDto);

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
          include: {
            itens: true,
            fornecedor: {
              select: { id: true, nome: true, ativo: true },
            },
          },
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
        },
      });

      return atualizado;
    } catch (error) {
      rethrowUniqueConflict(error, 'Conflito ao atualizar o pedido.');
      throw error;
    }
  }

  async aprovar(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.PEDIDO_APROVAR,
    );

    const atual = await this.findOne(id, lojaAtual);

    if (
      atual.status !== StatusPedidoCompra.RASCUNHO &&
      atual.status !== StatusPedidoCompra.EM_APROVACAO
    ) {
      throw new BadRequestException(
        'Somente pedidos em RASCUNHO ou EM_APROVACAO podem ser aprovados.',
      );
    }

    const atualizado = await this.prisma.pedidoCompra.update({
      where: { id },
      data: {
        status: StatusPedidoCompra.APROVADO,
        aprovado_por: usuarioId,
        aprovado_em: new Date(),
      },
      include: {
        itens: true,
        fornecedor: {
          select: { id: true, nome: true, ativo: true },
        },
      },
    });

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'PEDIDO_COMPRA',
      entidadeId: id,
      acao: 'APROVAR',
      statusAnterior: atual.status,
      statusNovo: StatusPedidoCompra.APROVADO,
      usuarioId,
      dados: { permissao: COMPRAS_PERMISSOES.PEDIDO_APROVAR },
    });

    return atualizado;
  }

  async historico(id: string, lojaAtual: loja) {
    await this.findOne(id, lojaAtual);
    return this.historicoService.listarPorEntidade(
      lojaAtual.id,
      'PEDIDO_COMPRA',
      id,
    );
  }

  private async assertFornecedorAtivo(fornecedorId: string, lojaId: string) {
    const fornecedor = await this.prisma.fornecedor.findFirst({
      where: { id: fornecedorId, loja_id: lojaId },
      select: { id: true, ativo: true },
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
  }

  private validarItens(itens: PedidoItemDto[]) {
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
}
