import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LOG_TIPO_EXPEDICAO_DEVOLUCAO } from '../constants/expedicao-log.constants';
import { StatusExpedicao } from '../enums/status-expedicao.enum';

const STATUS_EXPEDICAO_NAO_DEVOLVIVEIS = new Set<string>([
  StatusExpedicao.DEVOLVIDA,
  StatusExpedicao.ENTREGUE_FINALIZADO,
  StatusExpedicao.ARQUIVADO,
]);

export interface DevolverProducaoParams {
  expedicaoId: string;
  lojaId: string;
  usuarioId: string;
  motivo: string;
}

export interface DevolverProducaoResult {
  expedicao_id: string;
  os_id: string;
  workflow_reativado: boolean;
}

/**
 * Devolve OS da expedição para o PCP (retrabalho).
 * Todas as escritas ocorrem em uma única transação — falha atômica com rollback.
 */
@Injectable()
export class ExpedicaoDevolucaoService {
  private readonly logger = new Logger(ExpedicaoDevolucaoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async devolverParaProducao(
    params: DevolverProducaoParams,
  ): Promise<DevolverProducaoResult> {
    const { expedicaoId, lojaId, usuarioId, motivo } = params;

    const expedicao = await this.prisma.expedicaoLogistica.findFirst({
      where: { id: expedicaoId, loja_id: lojaId },
      select: {
        id: true,
        os_id: true,
        status: true,
        loja_id: true,
      },
    });

    if (!expedicao) {
      throw new NotFoundException('Expedição não encontrada');
    }

    if (STATUS_EXPEDICAO_NAO_DEVOLVIVEIS.has(expedicao.status)) {
      throw new BadRequestException(
        `Não é possível devolver expedição com status ${expedicao.status}`,
      );
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, loja_id: lojaId, status: 'ATIVO' },
      select: { id: true, nome_completo: true, email: true },
    });

    if (!usuario) {
      throw new NotFoundException(
        'Usuário não encontrado ou sem acesso à loja',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const expedicaoAtual = await tx.expedicaoLogistica.findFirst({
        where: {
          id: expedicaoId,
          loja_id: lojaId,
          status: {
            notIn: [
              StatusExpedicao.DEVOLVIDA,
              StatusExpedicao.ENTREGUE_FINALIZADO,
              StatusExpedicao.ARQUIVADO,
            ],
          },
        },
        select: { id: true, os_id: true, status: true },
      });

      if (!expedicaoAtual) {
        const expedicaoExistente = await tx.expedicaoLogistica.findFirst({
          where: { id: expedicaoId, loja_id: lojaId },
          select: { status: true },
        });

        if (!expedicaoExistente) {
          throw new NotFoundException('Expedição não encontrada');
        }

        throw new BadRequestException(
          `Não é possível devolver expedição com status ${expedicaoExistente.status}`,
        );
      }

      const os = await tx.ordemServico.findFirst({
        where: { id: expedicaoAtual.os_id, loja_id: lojaId },
        select: { id: true, numero: true },
      });

      if (!os) {
        throw new NotFoundException(
          'Ordem de serviço vinculada à expedição não encontrada',
        );
      }

      await tx.expedicaoLogistica.update({
        where: { id: expedicaoAtual.id },
        data: {
          status: StatusExpedicao.DEVOLVIDA,
          atualizado_em: new Date(),
        },
      });

      await tx.ordemServico.update({
        where: { id: os.id },
        data: {
          status: 'EM_WORKFLOW',
          retrabalho: true,
          modificado_por: usuarioId,
          motivo_modificacao: `Devolvida da expedição para produção: ${motivo}`,
        },
      });

      let workflowReativado = false;

      const workflowInstancia = await tx.workflowInstancia.findFirst({
        where: { os_id: os.id },
        select: { id: true },
      });

      if (workflowInstancia) {
        const setoresAtivos = await tx.workflowInstanciaSetor.findMany({
          where: {
            workflow_instancia_id: workflowInstancia.id,
            status: { not: 'CANCELADA' },
          },
          orderBy: [{ ordem: 'desc' }, { criado_em: 'desc' }],
        });

        if (setoresAtivos.length === 0) {
          throw new BadRequestException(
            'Workflow sem setores produtivos para reabrir retrabalho',
          );
        }

        const ordemUltimoSetor = Math.max(
          ...setoresAtivos.map((s) => s.ordem ?? 0),
        );
        const setorReferencia = setoresAtivos.find(
          (s) => (s.ordem ?? 0) === ordemUltimoSetor,
        );

        await tx.workflowInstanciaSetor.updateMany({
          where: {
            workflow_instancia_id: workflowInstancia.id,
            ordem: ordemUltimoSetor,
            status: { not: 'CANCELADA' },
          },
          data: {
            status: 'PENDENTE',
            data_conclusao: null,
            data_inicio: null,
            atualizado_em: new Date(),
          },
        });

        await tx.workflowInstancia.update({
          where: { id: workflowInstancia.id },
          data: {
            status: 'ATIVO',
            data_fim: null,
            etapa_atual: setorReferencia?.setor_id ?? null,
            atualizado_em: new Date(),
          },
        });

        workflowReativado = true;
      }

      const nomeOperador =
        usuario.nome_completo?.trim() || usuario.email || usuarioId;

      await tx.ordemServicoLog.create({
        data: {
          os_id: os.id,
          tipo_acao: LOG_TIPO_EXPEDICAO_DEVOLUCAO,
          descricao:
            `Expedição devolvida para produção por ${nomeOperador}. ` +
            `Motivo: ${motivo}`,
          usuario_id: usuarioId,
          dados_extras: JSON.stringify({
            expedicao_id: expedicaoAtual.id,
            motivo,
            usuario_id: usuarioId,
            usuario_nome: nomeOperador,
            workflow_reativado: workflowReativado,
            status_expedicao_anterior: expedicaoAtual.status,
          }),
        },
      });

      this.logger.log(
        `Expedição ${expedicaoAtual.id} devolvida — OS ${os.numero} em retrabalho`,
      );

      return {
        expedicao_id: expedicaoAtual.id,
        os_id: os.id,
        workflow_reativado: workflowReativado,
      };
    });
  }
}
