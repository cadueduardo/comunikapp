import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HomeOperacionalController } from './home-operacional.controller';
import { OnboardingService } from './services/onboarding.service';
import { ConfiguracaoRecomendadaService } from './services/configuracao-recomendada.service';
import { SystemStateService } from './services/system-state.service';

/**
 * Modulo da Home operacional (Fase 1).
 * Agregador de onboarding + configuracao recomendada + banner de estado.
 *
 * Demais endpoints (fluxo, alertas, resumo agregado) serao adicionados
 * nas Fases 4-5 do plano.
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HomeOperacionalController],
  providers: [
    OnboardingService,
    ConfiguracaoRecomendadaService,
    SystemStateService,
  ],
  exports: [OnboardingService],
})
export class HomeOperacionalModule {}
