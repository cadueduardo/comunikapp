import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatusRecebimentoCompra,
  loja,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentCodeService } from '../../documentos/document-code.service';
import {
  CancelarRecebimentoDto,
  CreateRecebimentoDto,
} from '../dto/create-recebimento.dto';
import { ComprasHistoricoService } from './compras-historico.service';
import {
  COMPRAS_PERMISSOES,
  ComprasPermissionsService,
} from './compras-permissions.service';
import { rethrowUniqueConflict } from './pedido-totais.util';
import {
  RECEBIMENTO_INCLUDE,
  assertLocalizacoesParaConfirmacao,
  assertSaldosRecebimento,
  carregarPedidoRecebivel,
  confirmarRecebimentoNoTx,
  estornarRecebimentoConfirmadoNoTx,
  validarItensRecebimento,
} from './recebimentos-confirmacao.util';

@Injectable()
export class RecebimentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentCode: DocumentCodeService,
    private readonly historicoService: ComprasHistoricoService,
    private readonly permissions: ComprasPermissionsService,
  ) {}

  async create(
    pedidoId: string,
    dto: CreateRecebimentoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.RECEBIMENTO_REGISTRAR,
    );

    if (dto.chave_idempotente) {
      const existente = await this.prisma.recebimentoCompra.findFirst({
        where: {
          loja_id: lojaAtual.id,
          chave_idempotente: dto.chave_idempotente,
        },
        include: RECEBIMENTO_INCLUDE,
      });
      if (existente) {
        return existente;
      }
    }

    const pedido = await carregarPedidoRecebivel(
      this.prisma,
      pedidoId,
      lojaAtual.id,
    );
    validarItensRecebimento(dto.itens, pedido.itens);

    const confirmar = Boolean(dto.confirmar);
    if (confirmar) {
      assertLocalizacoesParaConfirmacao(dto.itens);
      assertSaldosRecebimento(dto.itens, pedido.itens);
    }

    try {
      const numero = await this.documentCode.gerarCodigoRecebimentoCompra(
        lojaAtual.id,
      );

      const criado = await this.prisma.$transaction(async (tx) => {
        const recebimento = await tx.recebimentoCompra.create({
          data: {
            loja_id: lojaAtual.id,
            pedido_id: pedido.id,
            numero,
            status: StatusRecebimentoCompra.RASCUNHO,
            data_recebimento: dto.data_recebimento
              ? new Date(dto.data_recebimento)
              : undefined,
            responsavel_id: usuarioId,
            observacao: dto.observacao ?? null,
            chave_idempotente: dto.chave_idempotente ?? null,
            itens: {
              create: dto.itens.map((item) => ({
                loja_id: lojaAtual.id,
                pedido_item_id: item.pedido_item_id,
                quantidade_recebida: new Prisma.Decimal(item.quantidade_recebida),
                quantidade_aceita: new Prisma.Decimal(item.quantidade_aceita),
                quantidade_recusada: new Prisma.Decimal(
                  item.quantidade_recusada ?? 0,
                ),
                localizacao_id: item.localizacao_id ?? null,
                lote_codigo: item.lote_codigo ?? null,
                observacao: item.observacao ?? null,
              })),
            },
          },
          include: { itens: true },
        });

        if (confirmar) {
          return confirmarRecebimentoNoTx(
            tx,
            recebimento.id,
            lojaAtual.id,
            usuarioId,
          );
        }

        return tx.recebimentoCompra.findFirstOrThrow({
          where: { id: recebimento.id },
          include: RECEBIMENTO_INCLUDE,
        });
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'RECEBIMENTO_COMPRA',
        entidadeId: criado.id,
        acao: confirmar ? 'CONFIRMAR' : 'CRIAR',
        statusAnterior: StatusRecebimentoCompra.RASCUNHO,
        statusNovo: criado.status,
        dados: {
          pedido_id: pedido.id,
          numero: criado.numero,
          confirmar,
          chave_idempotente: dto.chave_idempotente ?? null,
        },
        usuarioId,
      });

      return criado;
    } catch (error) {
      rethrowUniqueConflict(
        error,
        'Já existe recebimento com este número ou chave idempotente nesta loja.',
      );
      throw error;
    }
  }

  async listByPedido(pedidoId: string, lojaAtual: loja) {
    const pedido = await this.prisma.pedidoCompra.findFirst({
      where: { id: pedidoId, loja_id: lojaAtual.id },
      select: { id: true },
    });
    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado nesta loja.');
    }
    return this.prisma.recebimentoCompra.findMany({
      where: { loja_id: lojaAtual.id, pedido_id: pedidoId },
      include: RECEBIMENTO_INCLUDE,
      orderBy: { criado_em: 'desc' },
    });
  }

  async findOne(id: string, lojaAtual: loja) {
    const recebimento = await this.prisma.recebimentoCompra.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: RECEBIMENTO_INCLUDE,
    });
    if (!recebimento) {
      throw new NotFoundException('Recebimento não encontrado nesta loja.');
    }
    return recebimento;
  }

  async confirmar(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.RECEBIMENTO_REGISTRAR,
    );

    const atual = await this.findOne(id, lojaAtual);
    if (atual.status === StatusRecebimentoCompra.CONFIRMADO) {
      return atual;
    }
    if (atual.status !== StatusRecebimentoCompra.RASCUNHO) {
      throw new BadRequestException(
        `Não é possível confirmar recebimento em status ${atual.status}.`,
      );
    }

    const confirmado = await this.prisma.$transaction(async (tx) =>
      confirmarRecebimentoNoTx(tx, id, lojaAtual.id, usuarioId),
    );

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'RECEBIMENTO_COMPRA',
      entidadeId: confirmado.id,
      acao: 'CONFIRMAR',
      statusAnterior: StatusRecebimentoCompra.RASCUNHO,
      statusNovo: StatusRecebimentoCompra.CONFIRMADO,
      dados: { pedido_id: confirmado.pedido_id, numero: confirmado.numero },
      usuarioId,
    });

    return confirmado;
  }

  async cancelar(
    id: string,
    dto: CancelarRecebimentoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.RECEBIMENTO_REGISTRAR,
    );

    const atual = await this.findOne(id, lojaAtual);

    if (atual.status === StatusRecebimentoCompra.RASCUNHO) {
      const cancelado = await this.prisma.recebimentoCompra.update({
        where: { id: atual.id },
        data: { status: StatusRecebimentoCompra.CANCELADO },
        include: RECEBIMENTO_INCLUDE,
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'RECEBIMENTO_COMPRA',
        entidadeId: cancelado.id,
        acao: 'CANCELAR',
        statusAnterior: StatusRecebimentoCompra.RASCUNHO,
        statusNovo: StatusRecebimentoCompra.CANCELADO,
        dados: { motivo: dto.motivo ?? null },
        usuarioId,
      });

      return cancelado;
    }

    if (atual.status === StatusRecebimentoCompra.CONFIRMADO) {
      const estornado = await this.prisma.$transaction(async (tx) =>
        estornarRecebimentoConfirmadoNoTx(
          tx,
          atual.id,
          lojaAtual.id,
          usuarioId,
          dto.motivo,
        ),
      );

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'RECEBIMENTO_COMPRA',
        entidadeId: estornado.id,
        acao: 'ESTORNAR',
        statusAnterior: StatusRecebimentoCompra.CONFIRMADO,
        statusNovo: StatusRecebimentoCompra.ESTORNADO,
        dados: { motivo: dto.motivo ?? null },
        usuarioId,
      });

      return estornado;
    }

    throw new BadRequestException(
      `Não é possível cancelar recebimento em status ${atual.status}.`,
    );
  }
}
