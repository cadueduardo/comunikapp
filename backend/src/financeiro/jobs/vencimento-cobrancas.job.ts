import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CobrancasService } from '../services/cobrancas.service';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';

/**
 * Job diario que recategoriza parcelas vencidas em todas as lojas (Fase 6.E).
 *
 * Como funciona:
 * - Roda toda madrugada (03:15 horario do servidor) para minimizar conflito
 *   com operacao manual durante o expediente.
 * - Para cada loja, chama `CobrancasService.recalcularVencimentosDaLoja`
 *   que marca parcelas vencidas, atualiza o status agregado da cobranca e
 *   registra log de auditoria via `MARCADA_VENCIDA`.
 * - Em caso de erro em uma loja, continua processando as demais (cada loja
 *   esta isolada em try/catch).
 * - Invalida cache da Home (`HomeCacheService.invalidar`) para a loja que
 *   teve mudancas, garantindo que o `ResumoFinanceiroSimples` veja os
 *   novos valores na proxima consulta.
 *
 * O job tambem expoe um metodo publico `executarAgora` para diagnosticos
 * e para os testes manuais (poderia ser exposto via endpoint admin no
 * futuro).
 */
@Injectable()
export class VencimentoCobrancasJob {
  private readonly logger = new Logger(VencimentoCobrancasJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cobrancasService: CobrancasService,
    private readonly homeCacheService: HomeCacheService,
  ) {}

  /**
   * Cron expression: '0 15 3 * * *' = 03:15 todos os dias.
   * Usar `CronExpression.EVERY_DAY_AT_3AM` arredondaria para 03:00; preferimos
   * 03:15 para evitar conflito com outros possiveis jobs de meia-noite e
   * dar tempo a backup, se houver.
   */
  @Cron('0 15 3 * * *', { name: 'financeiro.recategoriza_vencidas' })
  async executarDiario(): Promise<void> {
    this.logger.log(
      '[Cron Financeiro] Iniciando recategorizacao diaria de vencimentos',
    );
    await this.executar();
  }

  /**
   * Versao publica para chamadas manuais (testes, admin).
   * Nao deve ser chamado dentro do request HTTP do usuario - e operacao
   * de fundo que pode iterar varias lojas.
   */
  async executarAgora(): Promise<{
    lojas_processadas: number;
    cobrancas_atualizadas: number;
    parcelas_vencidas: number;
    erros: number;
  }> {
    return this.executar();
  }

  private async executar(): Promise<{
    lojas_processadas: number;
    cobrancas_atualizadas: number;
    parcelas_vencidas: number;
    erros: number;
  }> {
    const inicio = Date.now();
    // Processa apenas lojas ATIVAS (status do enum loja_status).
    // Lojas em INATIVO/BLOQUEADO/PENDENTE_VERIFICACAO ficam de fora.
    const lojas = await this.prisma.loja.findMany({
      where: { status: 'ATIVO' },
      select: { id: true, nome: true },
    });

    let totalCobrancas = 0;
    let totalParcelas = 0;
    let erros = 0;

    for (const loja of lojas) {
      try {
        const resultado =
          await this.cobrancasService.recalcularVencimentosDaLoja(loja.id);
        totalCobrancas += resultado.cobrancas_atualizadas;
        totalParcelas += resultado.parcelas_vencidas;

        if (resultado.cobrancas_atualizadas > 0) {
          // Invalida cache da Home para essa loja: o ResumoFinanceiro e
          // o FluxoTrabalho podem ter mudado (cobrancas marcadas vencidas).
          // A chave de cache e o proprio loja_id por convencao.
          this.homeCacheService.invalidar(loja.id);
          this.logger.log(
            `[Cron Financeiro] Loja ${loja.id} (${loja.nome}): ${resultado.cobrancas_atualizadas} cobranca(s) atualizada(s), ${resultado.parcelas_vencidas} parcela(s) marcada(s) como vencida(s)`,
          );
        }
      } catch (error) {
        erros++;
        this.logger.error(
          `[Cron Financeiro] Falha ao processar loja ${loja.id} (${loja.nome}): ${this.descreverErro(error)}`,
        );
      }
    }

    const duracaoMs = Date.now() - inicio;
    this.logger.log(
      `[Cron Financeiro] Recategorizacao concluida em ${duracaoMs}ms. Lojas: ${lojas.length}, cobrancas: ${totalCobrancas}, parcelas vencidas: ${totalParcelas}, erros: ${erros}`,
    );

    return {
      lojas_processadas: lojas.length,
      cobrancas_atualizadas: totalCobrancas,
      parcelas_vencidas: totalParcelas,
      erros,
    };
  }

  private descreverErro(error: unknown): string {
    if (error instanceof Error) return `${error.name}: ${error.message}`;
    return String(error);
  }
}
