import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HomeOperacionalController } from './home-operacional.controller';
import { OnboardingService } from './services/onboarding.service';
import { ConfiguracaoRecomendadaService } from './services/configuracao-recomendada.service';
import { SystemStateService } from './services/system-state.service';
import { FluxoTrabalhoService } from './services/fluxo-trabalho.service';
import { HomeCacheService } from './services/home-cache.service';

/**
 * Modulo da Home operacional.
 *
 * - Fase 1: onboarding + configuracao recomendada + banner de estado.
 * - Fase 4: agregador de fluxo (`GET /home-operacional/fluxo`) com
 *   `FluxoTrabalhoService` + `HomeCacheService`.
 * - Fase 5: `GET /home-operacional/alertas` (pendente).
 * - Fase 6: integracao com Cobranca para reabrir as colunas `a_receber`
 *   e `concluidos` do fluxo.
 *
 * `HomeCacheService` e `OnboardingService` sao exportados para que
 * outros modulos possam invalidar o cache ou ler o estado de onboarding
 * sem importar o controller.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HomeOperacionalController],
  providers: [
    OnboardingService,
    ConfiguracaoRecomendadaService,
    SystemStateService,
    FluxoTrabalhoService,
    HomeCacheService,
  ],
  exports: [OnboardingService, HomeCacheService],
})
export class HomeOperacionalModule {}
