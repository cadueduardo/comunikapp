import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CobrancasService } from '../../financeiro/services/cobrancas.service';
import { CobrancaStatus } from '../../financeiro/enums/cobranca-status.enum';
import { StatusExpedicao } from '../../expedicao/enums/status-expedicao.enum';
import { StatusOS } from '../interfaces/os.interfaces';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';

interface SnapshotInativacao {
  status_os: string;
  workflow_instancia?: {
    id: string;
    status: string;
  } | null;
  expedicoes: Array<{ id: string; status: string }>;
  cobranca?: {
    id: string;
    status: string;
    cancelada: boolean;
  } | null;
}

export interface ResultadoInativacaoOS {
  id: string;
  numero: string;
  ativo: false;
  cobranca_cancelada: boolean;
}

export interface ResultadoReativacaoOS {
  id: string;
  numero: string;
  ativo: true;
  status: string;
  cobranca_restaurada: boolean;
}

@Injectable()
export class OSInativacaoService {
  private readonly logger = new Logger(OSInativacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cobrancasService: CobrancasService,
    private readonly homeCacheService: HomeCacheService,
  ) {}

  async inativar(
    osId: string,
    lojaId: string,
    usuarioId: string,
    motivo: string,
  ): Promise<ResultadoInativacaoOS> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
      include: {
        workflow_instancia: { select: { id: true, status: true } },
        expedicoes_logistica: {
          where: { status: { not: StatusExpedicao.DEVOLVIDA } },
          select: { id: true, status: true },
        },
        orcamento: {
          select: {
            id: true,
            cobranca: {
              select: {
                id: true,
                status: true,
                valor_recebido: true,
              },
            },
          },
        },
      },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if (!os.ativo) {
      throw new BadRequestException('Esta OS já está inativa');
    }

    const cobranca = os.orcamento?.cobranca ?? null;
    if (cobranca) {
      const recebido = Number(cobranca.valor_recebido ?? 0);
      if (
        recebido > 0 ||
        cobranca.status === CobrancaStatus.LIQUIDADO ||
        cobranca.status === CobrancaStatus.PARCIAL_PAGO
      ) {
        throw new BadRequestException(
          'Não é possível inativar OS com cobrança já recebida ou parcialmente paga. Estorne os recebimentos antes.',
        );
      }
    }

    const snapshot: SnapshotInativacao = {
      status_os: os.status,
      workflow_instancia: os.workflow_instancia
        ? {
            id: os.workflow_instancia.id,
            status: os.workflow_instancia.status,
          }
        : null,
      expedicoes: os.expedicoes_logistica.map((e) => ({
        id: e.id,
        status: e.status,
      })),
      cobranca: cobranca
        ? {
            id: cobranca.id,
            status: cobranca.status,
            cancelada: false,
          }
        : null,
    };

    let cobrancaCancelada = false;

    await this.prisma.$transaction(async (tx) => {
      if (os.workflow_instancia) {
        await tx.workflowInstancia.update({
          where: { id: os.workflow_instancia.id },
          data: {
            status: 'CANCELADO',
            etapa_atual: null,
            atualizado_em: new Date(),
          },
        });

        await tx.workflowInstanciaSetor.updateMany({
          where: {
            workflow_instancia_id: os.workflow_instancia.id,
            status: { notIn: ['CONCLUIDA', 'CANCELADA'] },
          },
          data: {
            status: 'CANCELADA',
            atualizado_em: new Date(),
          },
        });
      }

      for (const expedicao of os.expedicoes_logistica) {
        if (
          expedicao.status !== StatusExpedicao.ARQUIVADO &&
          expedicao.status !== StatusExpedicao.ENTREGUE_FINALIZADO
        ) {
          await tx.expedicaoLogistica.update({
            where: { id: expedicao.id },
            data: {
              status: StatusExpedicao.ARQUIVADO,
              atualizado_em: new Date(),
            },
          });
        }
      }

      await tx.ordemServico.update({
        where: { id: osId },
        data: {
          ativo: false,
          inativado_em: new Date(),
          inativado_por: usuarioId,
          motivo_inativacao: motivo.trim(),
          status_antes_inativacao: os.status,
          snapshot_antes_inativacao: JSON.stringify(snapshot),
          status: StatusOS.CANCELADA,
          modificado_por: usuarioId,
          motivo_modificacao: `OS inativada: ${motivo.trim()}`,
        },
      });

      await tx.ordemServicoLog.create({
        data: {
          os_id: osId,
          usuario_id: usuarioId,
          tipo_acao: 'OS_INATIVADA',
          descricao: `OS inativada (soft delete). Motivo: ${motivo.trim()}`,
        },
      });
    });

    if (
      cobranca &&
      cobranca.status !== CobrancaStatus.CANCELADA
    ) {
      try {
        await this.cobrancasService.cancelar(
          cobranca.id,
          lojaId,
          `OS ${os.numero} inativada: ${motivo.trim()}`,
          usuarioId,
        );
        cobrancaCancelada = true;
        snapshot.cobranca = snapshot.cobranca
          ? { ...snapshot.cobranca, cancelada: true }
          : null;
        await this.prisma.ordemServico.update({
          where: { id: osId },
          data: {
            snapshot_antes_inativacao: JSON.stringify(snapshot),
          },
        });
      } catch (error) {
        this.logger.warn(
          `OS ${os.numero} inativada, mas cancelamento da cobrança falhou: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }

    this.homeCacheService.invalidarPorPrefixo(`${lojaId}:`);

    this.logger.log(`OS #${os.numero} inativada por ${usuarioId}`);

    return {
      id: osId,
      numero: os.numero,
      ativo: false,
      cobranca_cancelada: cobrancaCancelada,
    };
  }

  async reativar(
    osId: string,
    lojaId: string,
    usuarioId: string,
  ): Promise<ResultadoReativacaoOS> {
    const os = await this.prisma.ordemServico.findFirst({
      where: { id: osId, loja_id: lojaId },
    });

    if (!os) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    if (os.ativo) {
      throw new BadRequestException('Esta OS já está ativa');
    }

    let snapshot: SnapshotInativacao | null = null;
    if (os.snapshot_antes_inativacao) {
      try {
        snapshot = JSON.parse(
          os.snapshot_antes_inativacao,
        ) as SnapshotInativacao;
      } catch {
        snapshot = null;
      }
    }

    const statusRestaurado =
      os.status_antes_inativacao ||
      snapshot?.status_os ||
      StatusOS.LIBERADA_PARA_PCP;

    await this.prisma.$transaction(async (tx) => {
      if (snapshot?.workflow_instancia) {
        const wfStatus =
          snapshot.workflow_instancia.status === 'CANCELADO'
            ? 'ATIVO'
            : snapshot.workflow_instancia.status;

        await tx.workflowInstancia.update({
          where: { id: snapshot.workflow_instancia.id },
          data: {
            status: wfStatus,
            data_fim: wfStatus === 'CONCLUIDO' ? new Date() : null,
            atualizado_em: new Date(),
          },
        });
      }

      if (snapshot?.expedicoes?.length) {
        for (const exp of snapshot.expedicoes) {
          if (
            exp.status !== StatusExpedicao.DEVOLVIDA &&
            exp.status !== StatusExpedicao.ENTREGUE_FINALIZADO
          ) {
            await tx.expedicaoLogistica.updateMany({
              where: { id: exp.id, loja_id: lojaId },
              data: {
                status: exp.status as StatusExpedicao,
                atualizado_em: new Date(),
              },
            });
          }
        }
      }

      await tx.ordemServico.update({
        where: { id: osId },
        data: {
          ativo: true,
          status: statusRestaurado,
          inativado_em: null,
          inativado_por: null,
          motivo_inativacao: null,
          status_antes_inativacao: null,
          snapshot_antes_inativacao: null,
          modificado_por: usuarioId,
          motivo_modificacao: 'OS reativada',
        },
      });

      await tx.ordemServicoLog.create({
        data: {
          os_id: osId,
          usuario_id: usuarioId,
          tipo_acao: 'OS_REATIVADA',
          descricao: `OS reativada. Status restaurado: ${statusRestaurado}`,
        },
      });
    });

    this.homeCacheService.invalidarPorPrefixo(`${lojaId}:`);

    this.logger.log(`OS #${os.numero} reativada por ${usuarioId}`);

    return {
      id: osId,
      numero: os.numero,
      ativo: true,
      status: statusRestaurado,
      cobranca_restaurada: false,
    };
  }
}
