import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId } from '../auth/decorators';
import { OnboardingService } from './services/onboarding.service';
import { ConfiguracaoRecomendadaService } from './services/configuracao-recomendada.service';
import { SystemStateService } from './services/system-state.service';
import { FluxoTrabalhoService } from './services/fluxo-trabalho.service';
import { HomeCacheService } from './services/home-cache.service';
import { AtualizarOnboardingStepDto } from './dto/atualizar-onboarding-step.dto';
import { AplicarConfiguracaoRecomendadaDto } from './dto/aplicar-configuracao-recomendada.dto';
import { FluxoResponseData } from './interfaces/fluxo.interface';

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
    private readonly fluxoTrabalhoService: FluxoTrabalhoService,
    private readonly homeCacheService: HomeCacheService,
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

  /**
   * GET /home-operacional/fluxo
   *
   * Agregador de cards por estagio do trabalho. Contrato em
   * docs/fase-0-home-operacional/02-contratos-home-operacional.md secao 5.
   *
   * Cache: 60s por `loja_id`. Use `?refresh=1` para forcar recomputacao
   * (util para testes manuais; o front nao precisa enviar normalmente).
   */
  @Get('fluxo')
  async fluxo(
    @CurrentLojaId() lojaId: string,
    @Query('refresh') refresh?: string,
  ) {
    const chave = `fluxo:${lojaId}`;
    const bypass = refresh === '1' || refresh === 'true';

    const cached = this.homeCacheService.obter<FluxoResponseData>(
      chave,
      bypass,
    );
    if (cached) {
      return this.envelope(cached, { cache_hit: true });
    }

    const data = await this.fluxoTrabalhoService.montarFluxo(lojaId);
    this.homeCacheService.gravar(chave, data);
    return this.envelope(data, { cache_hit: false });
  }

  private envelope<T>(data: T, metaExtra?: Record<string, unknown>) {
    return {
      data,
      meta: {
        gerado_em: new Date().toISOString(),
        cache_hit: false,
        ...metaExtra,
      },
    };
  }
}
