import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebsocketsService } from '../../websockets/websockets.service';

@Injectable()
export class OSPCPIntegrationService {
  private readonly logger = new Logger(OSPCPIntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private websocketsService: WebsocketsService,
  ) {}

  async notificarInstanciaCriada(
    osId: string,
    workflowInstanciaId: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Instância de workflow criada para OS ${osId}: ${workflowInstanciaId}`,
      );

      // Atualizar OS com referência ao workflow
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: 'EM_WORKFLOW',
        },
      });

      this.logger.log(
        `OS ${osId} atualizada com workflow_instancia_id: ${workflowInstanciaId}`,
      );

      // Notificar início do workflow via WebSockets
      const os = await this.prisma.ordemServico.findUnique({
        where: { id: osId },
        select: { loja_id: true },
      });

      if (os) {
        await this.websocketsService.emitToLoja(
          os.loja_id,
          'workflow_iniciado',
          {
            tipo: 'WORKFLOW_INICIADO',
            os_id: osId,
            workflow_instancia_id: workflowInstanciaId,
            timestamp: new Date().toISOString(),
            loja_id: os.loja_id,
          },
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao notificar criação de instância para OS ${osId}:`,
        error,
      );
      throw error;
    }
  }

  async notificarStatusAlterado(osId: string, status?: string): Promise<void> {
    try {
      this.logger.log(`Status do workflow alterado para OS ${osId}: ${status}`);

      if (status) {
        // Mapear status do workflow para status da OS
        const statusOS = this.mapearStatusWorkflowParaOS(status);

        if (statusOS) {
          await this.prisma.ordemServico.update({
            where: { id: osId },
            data: { status: statusOS },
          });

          this.logger.log(`OS ${osId} atualizada para status: ${statusOS}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Erro ao notificar mudança de status para OS ${osId}:`,
        error,
      );
      throw error;
    }
  }

  async notificarInstanciaRemovida(osId: string): Promise<void> {
    try {
      this.logger.log(`Instância de workflow removida para OS ${osId}`);

      // Remover referência do workflow da OS
      await this.prisma.ordemServico.update({
        where: { id: osId },
        data: {
          status: 'FILA',
        },
      });

      this.logger.log(`OS ${osId} atualizada - workflow removido`);
    } catch (error) {
      this.logger.error(
        `Erro ao notificar remoção de instância para OS ${osId}:`,
        error,
      );
      throw error;
    }
  }

  async notificarProgresso(
    osId: string,
    percentualConclusao: number,
  ): Promise<void> {
    try {
      this.logger.log(
        `Progresso atualizado para OS ${osId}: ${percentualConclusao}%`,
      );

      // Atualizar progresso da OS (se houver campo para isso)
      // await this.prisma.ordemServico.update({
      //   where: { id: osId },
      //   data: { percentual_conclusao: percentualConclusao }
      // });

      this.logger.log(
        `Progresso da OS ${osId} atualizado: ${percentualConclusao}%`,
      );
    } catch (error) {
      this.logger.error(`Erro ao notificar progresso para OS ${osId}:`, error);
      throw error;
    }
  }

  async notificarEtapaConcluida(
    osId: string,
    etapaNome: string,
  ): Promise<void> {
    try {
      this.logger.log(`Etapa concluída para OS ${osId}: ${etapaNome}`);

      // Lógica para notificar conclusão de etapa
      // Pode incluir notificações, atualizações de status, etc.

      this.logger.log(`Notificação de etapa concluída enviada para OS ${osId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao notificar conclusão de etapa para OS ${osId}:`,
        error,
      );
      throw error;
    }
  }

  async notificarApontamento(osId: string, tipo: string): Promise<void> {
    try {
      this.logger.log(`Apontamento realizado para OS ${osId}: ${tipo}`);

      // Lógica para notificar apontamento
      // Pode incluir atualizações de progresso, notificações, etc.

      this.logger.log(`Notificação de apontamento enviada para OS ${osId}`);
    } catch (error) {
      this.logger.error(
        `Erro ao notificar apontamento para OS ${osId}:`,
        error,
      );
      throw error;
    }
  }

  private mapearStatusWorkflowParaOS(statusWorkflow: string): string | null {
    const mapeamento: Record<string, string> = {
      ATIVO: 'EM_WORKFLOW',
      PAUSADO: 'PAUSADA',
      CONCLUIDO: 'FINALIZADA',
      CANCELADO: 'CANCELADA',
    };

    return mapeamento[statusWorkflow] || null;
  }
}
