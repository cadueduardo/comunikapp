import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AUDITORIA_DESCRICAO_MAX,
  AUDITORIA_IP_MAX,
  AUDITORIA_USER_AGENT_MAX,
  ContextoDaRequisicao,
} from '../dto/aceite-proposta';
import { EventoComercial } from '../domain/eventos-comerciais';
import {
  mapearStatusComercialParaAprovacao,
  mapearStatusComercialParaLegado,
  OrcamentoStatusComercial,
  transicaoStatusComercialPermitida,
} from '../domain/status-comercial';

export type OrigemTransicaoComercial = 'INTERNO' | 'PUBLICO' | 'SISTEMA';

export interface ExecutarTransicaoComercial {
  readonly orcamentoId: string;
  readonly lojaId: string;
  readonly origemStatus: OrcamentoStatusComercial;
  readonly destinoStatus: OrcamentoStatusComercial;
  readonly origemAcao: OrigemTransicaoComercial;
  readonly autor: string;
  readonly tipoAuditoria: string;
  readonly descricao: string;
  readonly evento?: EventoComercial | null;
  readonly contexto?: ContextoDaRequisicao;
  readonly motivo?: string | null;
  readonly dadosAdicionais?: Record<string, unknown>;
  readonly whereAdicional?: Record<string, unknown>;
  readonly payloadAdicional?: Record<string, unknown>;
}

/**
 * Único writer do eixo `status_comercial` na Fase 6.
 *
 * Pode participar de uma transação já aberta (aceite/token) ou abrir sua própria
 * transação. Status, compatibilidade legada, auditoria e timeline sempre valem
 * ou falham juntos.
 */
@Injectable()
export class TransicaoComercialService {
  constructor(private readonly prisma: PrismaService) {}

  async executar(entrada: ExecutarTransicaoComercial): Promise<boolean> {
    return this.prisma.$transaction((tx) =>
      this.executarEmTransacao(tx, entrada),
    );
  }

  async executarEmTransacao(
    tx: Prisma.TransactionClient,
    entrada: ExecutarTransicaoComercial,
  ): Promise<boolean> {
    if (
      !transicaoStatusComercialPermitida(
        entrada.origemStatus,
        entrada.destinoStatus,
      )
    ) {
      throw new BadRequestException(
        `Transição comercial inválida: ${entrada.origemStatus} → ${entrada.destinoStatus}.`,
      );
    }

    return this.persistirEmTransacao(tx, entrada);
  }

  /**
   * Compensação técnica de um efeito externo que falhou após o commit (ex.: OS).
   * Não é uma transição de negócio e, por isso, não entra nas 23 passagens; ainda
   * assim usa o mesmo writer, CAS, dual-write e auditoria.
   */
  async compensarEmTransacao(
    tx: Prisma.TransactionClient,
    entrada: ExecutarTransicaoComercial,
  ): Promise<boolean> {
    return this.persistirEmTransacao(tx, entrada);
  }

  /** Repara legado em que a OS existe, mas o eixo comercial não foi promovido. */
  async reconciliarPedidoComOs(
    entrada: Omit<
      ExecutarTransicaoComercial,
      'destinoStatus' | 'evento' | 'origemAcao'
    >,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const possuiOs =
        (await tx.ordemServico.count({
          where: {
            orcamento_id: entrada.orcamentoId,
            loja_id: entrada.lojaId,
          },
        })) > 0;
      if (!possuiOs) {
        throw new BadRequestException(
          'Não é possível confirmar o pedido sem uma ordem de serviço vinculada.',
        );
      }

      return this.persistirEmTransacao(tx, {
        ...entrada,
        destinoStatus: OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
        origemAcao: 'SISTEMA',
        evento: 'vendas.pedido.confirmado',
      });
    });
  }

  private async persistirEmTransacao(
    tx: Prisma.TransactionClient,
    entrada: ExecutarTransicaoComercial,
  ): Promise<boolean> {
    const statusLegado = mapearStatusComercialParaLegado(
      entrada.destinoStatus,
    );
    const alterado = await tx.orcamento.updateMany({
      where: {
        id: entrada.orcamentoId,
        loja_id: entrada.lojaId,
        status_comercial: entrada.origemStatus,
        ...(entrada.whereAdicional ?? {}),
      },
      data: {
        status: statusLegado,
        status_comercial: entrada.destinoStatus,
        status_aprovacao: mapearStatusComercialParaAprovacao(
          entrada.destinoStatus,
        ),
        data_atualizacao: new Date(),
        ...(entrada.dadosAdicionais ?? {}),
      } as never,
    });

    if (alterado.count !== 1) {
      return false;
    }

    await tx.orcamentoLog.create({
      data: {
        orcamento_id: entrada.orcamentoId,
        tipo_acao: entrada.tipoAuditoria.slice(0, 100),
        descricao: entrada.descricao.slice(0, AUDITORIA_DESCRICAO_MAX),
        dados_extras: JSON.stringify({
          origem: entrada.origemAcao,
          autor: entrada.autor,
          status_anterior: mapearStatusComercialParaLegado(
            entrada.origemStatus,
          ),
          status_novo: statusLegado,
        }),
        ip_origem: entrada.contexto?.ip?.slice(0, AUDITORIA_IP_MAX) ?? null,
        user_agent:
          entrada.contexto?.userAgent?.slice(0, AUDITORIA_USER_AGENT_MAX) ??
          null,
      },
    });

    await tx.historicoOrcamento.create({
      data: {
        orcamento: { connect: { id: entrada.orcamentoId } },
        loja: { connect: { id: entrada.lojaId } },
        acao: 'mudanca_status_comercial',
        evento: entrada.evento ?? null,
        descricao: entrada.descricao,
        usuario_id: entrada.origemAcao === 'INTERNO' ? entrada.autor : null,
        payload: {
          origem: entrada.origemStatus,
          destino: entrada.destinoStatus,
          canal: entrada.origemAcao,
          autor: entrada.autor,
          motivo: entrada.motivo ?? null,
          ...(entrada.payloadAdicional ?? {}),
        } as Prisma.InputJsonValue,
      },
    });

    return true;
  }
}
