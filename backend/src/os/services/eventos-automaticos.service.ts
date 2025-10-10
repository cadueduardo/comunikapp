import { Injectable, Logger } from '@nestjs/common';
import { WebsocketsService } from '../../websockets/websockets.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EventosAutomaticosService {
  private readonly logger = new Logger(EventosAutomaticosService.name);

  constructor(
    private readonly websocketsService: WebsocketsService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Notifica mudança de status da OS via WebSocket
   */
  async notificarMudancaStatusOS(
    osId: string, 
    statusAnterior: string, 
    statusNovo: string, 
    lojaId: string,
    usuarioId?: string
  ): Promise<void> {
    try {
      this.logger.log(`📢 Notificando mudança de status OS ${osId}: ${statusAnterior} → ${statusNovo}`);

      const evento = {
        tipo: 'OS_STATUS_CHANGED',
        os_id: osId,
        status_anterior: statusAnterior,
        status_novo: statusNovo,
        usuario_id: usuarioId,
        timestamp: new Date().toISOString(),
        loja_id: lojaId
      };

      // Notificar toda a loja
      await this.websocketsService.emitToLoja(lojaId, 'os_status_changed', evento);

      // Log no banco de dados
      await this.registrarLogEvento(evento);

    } catch (error) {
      this.logger.error(`Erro ao notificar mudança de status OS ${osId}:`, error);
    }
  }

  /**
   * Notifica liberação de OS para PCP
   */
  async notificarOSLiberadaParaPCP(
    osId: string, 
    lojaId: string, 
    workflowId?: string,
    usuarioId?: string
  ): Promise<void> {
    try {
      this.logger.log(`🚀 Notificando OS ${osId} liberada para PCP`);

      const evento = {
        tipo: 'OS_LIBERADA_PCP',
        os_id: osId,
        workflow_id: workflowId,
        usuario_id: usuarioId,
        timestamp: new Date().toISOString(),
        loja_id: lojaId
      };

      // Notificar toda a loja
      await this.websocketsService.emitToLoja(lojaId, 'os_liberada_pcp', evento);

      // Log no banco de dados
      await this.registrarLogEvento(evento);

    } catch (error) {
      this.logger.error(`Erro ao notificar OS liberada para PCP ${osId}:`, error);
    }
  }

  /**
   * Notifica início de workflow PCP
   */
  async notificarInicioWorkflow(
    osId: string, 
    workflowInstanciaId: string, 
    lojaId: string,
    usuarioId?: string
  ): Promise<void> {
    try {
      this.logger.log(`⚙️ Notificando início de workflow para OS ${osId}`);

      const evento = {
        tipo: 'WORKFLOW_INICIADO',
        os_id: osId,
        workflow_instancia_id: workflowInstanciaId,
        usuario_id: usuarioId,
        timestamp: new Date().toISOString(),
        loja_id: lojaId
      };

      // Notificar toda a loja
      await this.websocketsService.emitToLoja(lojaId, 'workflow_iniciado', evento);

      // Log no banco de dados
      await this.registrarLogEvento(evento);

    } catch (error) {
      this.logger.error(`Erro ao notificar início de workflow ${workflowInstanciaId}:`, error);
    }
  }

  /**
   * Notifica conclusão de etapa do workflow
   */
  async notificarEtapaConcluida(
    osId: string, 
    etapaNome: string, 
    lojaId: string,
    usuarioId?: string
  ): Promise<void> {
    try {
      this.logger.log(`✅ Notificando etapa concluída: ${etapaNome} para OS ${osId}`);

      const evento = {
        tipo: 'ETAPA_CONCLUIDA',
        os_id: osId,
        etapa_nome: etapaNome,
        usuario_id: usuarioId,
        timestamp: new Date().toISOString(),
        loja_id: lojaId
      };

      // Notificar toda a loja
      await this.websocketsService.emitToLoja(lojaId, 'etapa_concluida', evento);

      // Log no banco de dados
      await this.registrarLogEvento(evento);

    } catch (error) {
      this.logger.error(`Erro ao notificar etapa concluída ${etapaNome}:`, error);
    }
  }

  /**
   * Notifica conclusão de workflow PCP
   */
  async notificarWorkflowConcluido(
    osId: string, 
    workflowInstanciaId: string, 
    lojaId: string,
    usuarioId?: string
  ): Promise<void> {
    try {
      this.logger.log(`🎉 Notificando workflow concluído para OS ${osId}`);

      const evento = {
        tipo: 'WORKFLOW_CONCLUIDO',
        os_id: osId,
        workflow_instancia_id: workflowInstanciaId,
        usuario_id: usuarioId,
        timestamp: new Date().toISOString(),
        loja_id: lojaId
      };

      // Notificar toda a loja
      await this.websocketsService.emitToLoja(lojaId, 'workflow_concluido', evento);

      // Log no banco de dados
      await this.registrarLogEvento(evento);

    } catch (error) {
      this.logger.error(`Erro ao notificar workflow concluído ${workflowInstanciaId}:`, error);
    }
  }

  /**
   * Notifica aprovação técnica
   */
  async notificarAprovacaoTecnica(
    osId: string, 
    aprovado: boolean, 
    lojaId: string,
    usuarioId?: string,
    observacoes?: string
  ): Promise<void> {
    try {
      this.logger.log(`🔍 Notificando aprovação técnica OS ${osId}: ${aprovado ? 'APROVADA' : 'REJEITADA'}`);

      const evento = {
        tipo: 'APROVACAO_TECNICA',
        os_id: osId,
        aprovado: aprovado,
        observacoes: observacoes,
        usuario_id: usuarioId,
        timestamp: new Date().toISOString(),
        loja_id: lojaId
      };

      // Notificar toda a loja
      await this.websocketsService.emitToLoja(lojaId, 'aprovacao_tecnica', evento);

      // Log no banco de dados
      await this.registrarLogEvento(evento);

    } catch (error) {
      this.logger.error(`Erro ao notificar aprovação técnica OS ${osId}:`, error);
    }
  }

  /**
   * Notifica alerta de prazo
   */
  async notificarAlertaPrazo(
    osId: string, 
    diasParaVencimento: number, 
    lojaId: string,
    usuarioId?: string
  ): Promise<void> {
    try {
      this.logger.log(`⚠️ Notificando alerta de prazo OS ${osId}: ${diasParaVencimento} dias`);

      const evento = {
        tipo: 'ALERTA_PRAZO',
        os_id: osId,
        dias_para_vencimento: diasParaVencimento,
        usuario_id: usuarioId,
        timestamp: new Date().toISOString(),
        loja_id: lojaId
      };

      // Notificar toda a loja
      await this.websocketsService.emitToLoja(lojaId, 'alerta_prazo', evento);

      // Log no banco de dados
      await this.registrarLogEvento(evento);

    } catch (error) {
      this.logger.error(`Erro ao notificar alerta de prazo OS ${osId}:`, error);
    }
  }

  /**
   * Registra log do evento no banco de dados
   */
  private async registrarLogEvento(evento: any): Promise<void> {
    try {
      // Aqui você pode salvar o evento em uma tabela de logs se necessário
      // Por enquanto, apenas log no console
      this.logger.log(`📝 Log evento: ${JSON.stringify(evento)}`);
    } catch (error) {
      this.logger.error('Erro ao registrar log do evento:', error);
    }
  }

  /**
   * Verifica e processa eventos automáticos pendentes
   */
  async processarEventosAutomaticos(): Promise<void> {
    try {
      this.logger.log('🔄 Processando eventos automáticos...');

      // Verificar OSs com prazo próximo (últimos 3 dias)
      const ossProximoVencimento = await this.prisma.ordemServico.findMany({
        where: {
          data_prazo: {
            gte: new Date(),
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
          },
          status: {
            in: ['LIBERADA_PARA_PCP', 'EM_WORKFLOW', 'PRODUCAO']
          }
        },
        include: {
          loja: true
        }
      });

      for (const os of ossProximoVencimento) {
        const diasParaVencimento = Math.ceil(
          (new Date(os.data_prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasParaVencimento <= 3 && diasParaVencimento > 0) {
          await this.notificarAlertaPrazo(
            os.id,
            diasParaVencimento,
            os.loja_id
          );
        }
      }

      this.logger.log(`✅ Processados ${ossProximoVencimento.length} eventos automáticos`);

    } catch (error) {
      this.logger.error('Erro ao processar eventos automáticos:', error);
    }
  }
}












