import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';
import { OnboardingService } from './services/onboarding.service';
import { ConfiguracaoRecomendadaService } from './services/configuracao-recomendada.service';
import { SystemStateService } from './services/system-state.service';
import { AtualizarOnboardingStepDto } from './dto/atualizar-onboarding-step.dto';
import { AplicarConfiguracaoRecomendadaDto } from './dto/aplicar-configuracao-recomendada.dto';

/**
 * Controlador da Home operacional. Endpoints documentados em
 * docs/fase-0-home-operacional/02-contratos-home-operacional.md
 *
 * Convencoes:
 * - Todas as rotas exigem JWT valido (loja_id vem do token).
 * - Resposta envelopada em { data, meta }.
 */
@Controller('home-operacional')
@UseGuards(JwtAuthGuard)
export class HomeOperacionalController {
  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly configuracaoRecomendadaService: ConfiguracaoRecomendadaService,
    private readonly systemStateService: SystemStateService,
  ) {}

  @Get('onboarding')
  async obterOnboarding(@CurrentLojaId() lojaId: string) {
    const data = await this.onboardingService.obterResumo(lojaId);
    return this.envelope(data);
  }

  @Patch('onboarding/:stepId')
  async atualizarStep(
    @CurrentLojaId() lojaId: string,
    @Param('stepId') stepId: string,
    @Body() dto: AtualizarOnboardingStepDto,
  ) {
    const data = await this.onboardingService.atualizarStep(lojaId, stepId, dto.acao);
    return this.envelope(data);
  }

  @Post('onboarding/aplicar-configuracao-recomendada')
  async aplicarConfiguracaoRecomendada(
    @CurrentLojaId() lojaId: string,
    @Body() dto: AplicarConfiguracaoRecomendadaDto,
  ) {
    const data = await this.configuracaoRecomendadaService.aplicar(lojaId, {
      sobrescreverExistentes: dto.sobrescrever_existentes === true,
    });
    return this.envelope(data);
  }

  @Get('banner-estado')
  async banner(@CurrentLojaId() lojaId: string) {
    const mensagens = await this.systemStateService.listarMensagens(lojaId);
    return this.envelope({ mensagens });
  }

  private envelope<T>(data: T) {
    return {
      data,
      meta: { gerado_em: new Date().toISOString(), cache_hit: false },
    };
  }
}
