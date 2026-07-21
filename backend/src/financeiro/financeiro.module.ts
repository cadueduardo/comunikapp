import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HomeOperacionalModule } from '../home-operacional/home-operacional.module';
import { InstalacaoModule } from '../instalacao/instalacao.module';
import { FinanceiroController } from './financeiro.controller';
import { CobrancasService } from './services/cobrancas.service';
import { FinanceiroDashboardService } from './services/financeiro-dashboard.service';
import { ParcelasBuilderService } from './services/parcelas-builder.service';
import { StatusRollupService } from './services/status-rollup.service';
import { CobrancaVencimentoService } from './services/cobranca-vencimento.service';
import { VencimentoCobrancasJob } from './jobs/vencimento-cobrancas.job';
import { ContasPagarModule } from './contas-pagar/contas-pagar.module';
import { PosCalculoModule } from './pos-calculo/pos-calculo.module';

/**
 * Modulo do financeiro minimo (Fase 6) + Contas a Pagar (Compras MVP Fase 4).
 *
 * Exporta `CobrancasService` para que o modulo de Orcamentos V2 possa criar
 * a cobranca automaticamente apos aprovar um orcamento, e
 * `CobrancaVencimentoService` para que o orcamento ja parseie o prazo_entrega
 * antes de salvar.
 *
 * Importa `HomeOperacionalModule` apenas para usar `HomeCacheService` no job
 * de vencimento diario (Fase 6.E) - nao ha dependencia circular pois o
 * HomeOperacionalModule nao importa o FinanceiroModule.
 *
 * `ContasPagarModule` registra rotas em `/financeiro/contas-pagar` e
 * `/financeiro/pagamentos` (obrigacoes a fornecedores).
 *
 * `PosCalculoModule` expoe GET `/financeiro/os/:osId/pos-calculo`.
 */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HomeOperacionalModule,
    InstalacaoModule,
    ContasPagarModule,
    PosCalculoModule,
  ],
  controllers: [FinanceiroController],
  providers: [
    CobrancasService,
    FinanceiroDashboardService,
    ParcelasBuilderService,
    StatusRollupService,
    CobrancaVencimentoService,
    VencimentoCobrancasJob, // Fase 6.E - cron job diario de vencimento
  ],
  exports: [
    CobrancasService,
    CobrancaVencimentoService,
    ParcelasBuilderService,
    StatusRollupService,
    ContasPagarModule,
    PosCalculoModule,
  ],
})
export class FinanceiroModule {}
