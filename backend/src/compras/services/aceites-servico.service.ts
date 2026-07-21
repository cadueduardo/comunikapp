import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatusAceiteServico,
  loja,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentCodeService } from '../../documentos/document-code.service';
import {
  CancelarAceiteServicoDto,
  CreateAceiteServicoDto,
} from '../dto/create-aceite-servico.dto';
import { ComprasHistoricoService } from './compras-historico.service';
import {
  COMPRAS_PERMISSOES,
  ComprasPermissionsService,
} from './compras-permissions.service';
import { rethrowUniqueConflict } from './pedido-totais.util';
import {
  ACEITE_INCLUDE,
  assertSaldosAceite,
  carregarPedidoAceitavel,
  confirmarAceiteNoTx,
  estornarAceiteConfirmadoNoTx,
  validarItensAceite,
} from './aceites-confirmacao.util';

@Injectable()
export class AceitesServicoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentCode: DocumentCodeService,
    private readonly historicoService: ComprasHistoricoService,
    private readonly permissions: ComprasPermissionsService,
  ) {}

  async create(
    pedidoId: string,
    dto: CreateAceiteServicoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SERVICO_ACEITAR,
    );

    if (dto.chave_idempotente) {
      const existente = await this.prisma.aceiteServico.findFirst({
        where: {
          loja_id: lojaAtual.id,
          chave_idempotente: dto.chave_idempotente,
        },
        include: ACEITE_INCLUDE,
      });
      if (existente) {
        return existente;
      }
    }

    const pedido = await carregarPedidoAceitavel(
      this.prisma,
      pedidoId,
      lojaAtual.id,
    );
    validarItensAceite(dto.itens, pedido.itens);

    const confirmar = Boolean(dto.confirmar);
    if (confirmar) {
      assertSaldosAceite(dto.itens, pedido.itens);
    }

    try {
      const numero = await this.documentCode.gerarCodigoAceiteServico(
        lojaAtual.id,
      );

      const criado = await this.prisma.$transaction(async (tx) => {
        const aceite = await tx.aceiteServico.create({
          data: {
            loja_id: lojaAtual.id,
            pedido_id: pedido.id,
            numero,
            status: StatusAceiteServico.RASCUNHO,
            periodo_inicio: dto.periodo_inicio
              ? new Date(dto.periodo_inicio)
              : null,
            periodo_fim: dto.periodo_fim ? new Date(dto.periodo_fim) : null,
            responsavel_id: usuarioId,
            aceite_final: Boolean(dto.aceite_final),
            observacao: dto.observacao ?? null,
            chave_idempotente: dto.chave_idempotente ?? null,
            itens: {
              create: dto.itens.map((item) => ({
                loja_id: lojaAtual.id,
                pedido_item_id: item.pedido_item_id,
                quantidade_aceita:
                  item.quantidade_aceita != null
                    ? new Prisma.Decimal(item.quantidade_aceita)
                    : null,
                percentual_aceito:
                  item.percentual_aceito != null
                    ? new Prisma.Decimal(item.percentual_aceito)
                    : null,
                valor_aceito:
                  item.valor_aceito != null
                    ? new Prisma.Decimal(item.valor_aceito)
                    : null,
                observacao: item.observacao ?? null,
              })),
            },
          },
          include: { itens: true },
        });

        if (confirmar) {
          return confirmarAceiteNoTx(tx, aceite.id, lojaAtual.id);
        }

        return tx.aceiteServico.findFirstOrThrow({
          where: { id: aceite.id },
          include: ACEITE_INCLUDE,
        });
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'ACEITE_SERVICO',
        entidadeId: criado.id,
        acao: confirmar ? 'CONFIRMAR' : 'CRIAR',
        statusAnterior: StatusAceiteServico.RASCUNHO,
        statusNovo: criado.status,
        dados: {
          pedido_id: pedido.id,
          numero: criado.numero,
          aceite_final: criado.aceite_final,
          confirmar,
        },
        usuarioId,
      });

      return criado;
    } catch (error) {
      rethrowUniqueConflict(
        error,
        'Já existe aceite com este número ou chave idempotente nesta loja.',
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
    return this.prisma.aceiteServico.findMany({
      where: { loja_id: lojaAtual.id, pedido_id: pedidoId },
      include: ACEITE_INCLUDE,
      orderBy: { criado_em: 'desc' },
    });
  }

  async findOne(id: string, lojaAtual: loja) {
    const aceite = await this.prisma.aceiteServico.findFirst({
      where: { id, loja_id: lojaAtual.id },
      include: ACEITE_INCLUDE,
    });
    if (!aceite) {
      throw new NotFoundException(
        'Aceite de serviço não encontrado nesta loja.',
      );
    }
    return aceite;
  }

  async confirmar(id: string, lojaAtual: loja, usuarioId: string) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SERVICO_ACEITAR,
    );

    const atual = await this.findOne(id, lojaAtual);
    if (atual.status === StatusAceiteServico.CONFIRMADO) {
      return atual;
    }
    if (atual.status !== StatusAceiteServico.RASCUNHO) {
      throw new BadRequestException(
        `Não é possível confirmar aceite em status ${atual.status}.`,
      );
    }

    const confirmado = await this.prisma.$transaction(async (tx) =>
      confirmarAceiteNoTx(tx, id, lojaAtual.id),
    );

    await this.historicoService.registrar({
      lojaId: lojaAtual.id,
      entidadeTipo: 'ACEITE_SERVICO',
      entidadeId: confirmado.id,
      acao: 'CONFIRMAR',
      statusAnterior: StatusAceiteServico.RASCUNHO,
      statusNovo: StatusAceiteServico.CONFIRMADO,
      dados: {
        pedido_id: confirmado.pedido_id,
        numero: confirmado.numero,
        aceite_final: confirmado.aceite_final,
      },
      usuarioId,
    });

    return confirmado;
  }

  async cancelar(
    id: string,
    dto: CancelarAceiteServicoDto,
    lojaAtual: loja,
    usuarioId: string,
  ) {
    await this.permissions.assertPode(
      usuarioId,
      lojaAtual.id,
      COMPRAS_PERMISSOES.SERVICO_ACEITAR,
    );

    const atual = await this.findOne(id, lojaAtual);

    if (atual.status === StatusAceiteServico.RASCUNHO) {
      const cancelado = await this.prisma.aceiteServico.update({
        where: { id: atual.id },
        data: { status: StatusAceiteServico.CANCELADO },
        include: ACEITE_INCLUDE,
      });

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'ACEITE_SERVICO',
        entidadeId: cancelado.id,
        acao: 'CANCELAR',
        statusAnterior: StatusAceiteServico.RASCUNHO,
        statusNovo: StatusAceiteServico.CANCELADO,
        dados: { motivo: dto.motivo ?? null },
        usuarioId,
      });

      return cancelado;
    }

    if (atual.status === StatusAceiteServico.CONFIRMADO) {
      const estornado = await this.prisma.$transaction(async (tx) =>
        estornarAceiteConfirmadoNoTx(tx, atual.id, lojaAtual.id),
      );

      await this.historicoService.registrar({
        lojaId: lojaAtual.id,
        entidadeTipo: 'ACEITE_SERVICO',
        entidadeId: estornado.id,
        acao: 'ESTORNAR',
        statusAnterior: StatusAceiteServico.CONFIRMADO,
        statusNovo: StatusAceiteServico.ESTORNADO,
        dados: { motivo: dto.motivo ?? null },
        usuarioId,
      });

      return estornado;
    }

    throw new BadRequestException(
      `Não é possível cancelar aceite em status ${atual.status}.`,
    );
  }
}
