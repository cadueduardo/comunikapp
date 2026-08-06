import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExpiracaoOrcamentosService } from '../services/expiracao-orcamentos.service';

/**
 * Job 6.3 - Worker de Expiração Canônica de Propostas.
 *
 * Agendado periodicamente para varrer e expirar propostas comerciais vencidas.
 */
@Injectable()
export class ExpiracaoOrcamentosJob {
  private readonly logger = new Logger(ExpiracaoOrcamentosJob.name);
  private emExecucao = false;

  constructor(
    private readonly expiracaoService: ExpiracaoOrcamentosService,
  ) {}

  @Cron('0 */15 * * * *', { name: 'vendas.propostas.expiracao' })
  async executarExpiracaoProgramada(): Promise<void> {
    if (this.emExecucao) {
      this.logger.debug('Job de expiração de propostas já em execução, ignorando ciclo.');
      return;
    }

    this.emExecucao = true;
    try {
      this.logger.log('Iniciando varredura programada de propostas expiradas...');
      const res = await this.expiracaoService.processarPropostasExpiradas();
      this.logger.log(
        `Varredura concluída com sucesso: ${res.expirados} propostas expiradas de ${res.processados} processadas.`,
      );
    } catch (err) {
      this.logger.error(
        `Falha durante execução do job de expiração: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.emExecucao = false;
    }
  }
}
