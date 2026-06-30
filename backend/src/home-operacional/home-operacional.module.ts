import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ArteAprovacaoModule } from '../modules/arte-aprovacao/arte-aprovacao.module';
import { InstalacaoModule } from '../instalacao/instalacao.module';
import { HomeOperacionalController } from './home-operacional.controller';
import { OnboardingService } from './services/onboarding.service';
import { ConfiguracaoRecomendadaService } from './services/configuracao-recomendada.service';
import { SystemStateService } from './services/system-state.service';
import { FluxoTrabalhoService } from './services/fluxo-trabalho.service';
import { HomeCacheService } from './services/home-cache.service';
import { AlertasOperacionaisService } from './services/alertas-operacionais.service';
import { KpiDashboardService } from './services/kpi-dashboard.service';
import { ResumoFinanceiroService } from './services/resumo-financeiro.service';
import { ContadoresMenuService } from './services/contadores-menu.service';

/**
 * Modulo da Home operacional.
 *
 * - Fase 1: onboarding + configuracao recomendada + banner de estado.
 * - Fase 4: agregador de fluxo (`GET /home-operacional/fluxo`) com
 *   `FluxoTrabalhoService` + `HomeCacheService`.
 * - Fase 5: alertas operacionais (`GET /home-operacional/alertas`) com
 *   `AlertasOperacionaisService` reutilizando o `HomeCacheService`.
 * - Fase 6: integracao com Cobranca para reabrir as colunas `a_receber`
 *   e `concluidos` do fluxo e habilitar o alerta de "trabalho pronto sem
 *   recebimento" (placeholder no front por enquanto).
 *
 * `HomeCacheService` e `OnboardingService` sao exportados para que
 * outros modulos possam invalidar o cache ou ler o estado de onboarding
 * sem importar o controller.
 */
@Module({
  imports: [PrismaModule, AuthModule, ArteAprovacaoModule, InstalacaoModule],
  controllers: [HomeOperacionalController],
  providers: [
    OnboardingService,
    ConfiguracaoRecomendadaService,
    SystemStateService,
    FluxoTrabalhoService,
    HomeCacheService,
    AlertasOperacionaisService,
    KpiDashboardService,
    ResumoFinanceiroService, // Fase 6.C
    ContadoresMenuService,
  ],
  exports: [OnboardingService, HomeCacheService],
})
export class HomeOperacionalModule {}
