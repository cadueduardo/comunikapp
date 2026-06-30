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
import { AlertasOperacionaisService } from './services/alertas-operacionais.service';
import { KpiDashboardService } from './services/kpi-dashboard.service';
import { ResumoFinanceiroService } from './services/resumo-financeiro.service';
import { ContadoresMenuService } from './services/contadores-menu.service';
import { AtualizarOnboardingStepDto } from './dto/atualizar-onboarding-step.dto';
import { AplicarConfiguracaoRecomendadaDto } from './dto/aplicar-configuracao-recomendada.dto';
import { FluxoResponseData } from './interfaces/fluxo.interface';
import { AlertasResponseData } from './interfaces/alerta.interface';
import { KpisResumo } from './interfaces/kpi.interface';

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
    private readonly alertasOperacionaisService: AlertasOperacionaisService,
    private readonly kpiDashboardService: KpiDashboardService,
    private readonly resumoFinanceiroService: ResumoFinanceiroService,
    private readonly contadoresMenuService: ContadoresMenuService,
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
    const data = await this.onboardingService.atualizarStep(
      lojaId,
      stepId,
      dto.acao,
    );
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

  @Post('onboarding/aplicar-entrega-instalacao')
  async aplicarEntregaInstalacao(@CurrentLojaId() lojaId: string) {
    const data =
      await this.configuracaoRecomendadaService.aplicarSomenteEntregaInstalacao(
        lojaId,
      );
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

  /**
   * GET /home-operacional/alertas
   *
   * Lista de alertas operacionais ordenados por nivel (critico > atencao >
   * informativo). Contrato em
   * docs/fase-0-home-operacional/02-contratos-home-operacional.md secao 6.
   *
   * Cache: 60s por `loja_id`. Use `?refresh=1` para forcar recomputacao.
   */
  @Get('alertas')
  async alertas(
    @CurrentLojaId() lojaId: string,
    @Query('refresh') refresh?: string,
  ) {
    const chave = `alertas:${lojaId}`;
    const bypass = refresh === '1' || refresh === 'true';

    const cached = this.homeCacheService.obter<AlertasResponseData>(
      chave,
      bypass,
    );
    if (cached) {
      return this.envelope(cached, { cache_hit: true });
    }

    const data = await this.alertasOperacionaisService.listar(lojaId);
    this.homeCacheService.gravar(chave, data);
    return this.envelope(data, { cache_hit: false });
  }

  /**
   * GET /home-operacional/kpis
   *
   * 4 indicadores agregados exibidos no topo do dashboard:
   * - Orçamentos abertos (count)
   * - Total orçado no mês corrente (sum, moeda)
   * - OS em produção (count)
   * - Alertas críticos (count)
   *
   * Cache: 60s por `loja_id` (chave separada `kpis:<lojaId>`). Use
   * `?refresh=1` para forçar recomputação.
   */
  @Get('kpis')
  async kpis(
    @CurrentLojaId() lojaId: string,
    @Query('refresh') refresh?: string,
  ) {
    const chave = `kpis:${lojaId}`;
    const bypass = refresh === '1' || refresh === 'true';

    const cached = this.homeCacheService.obter<KpisResumo>(chave, bypass);
    if (cached) {
      return this.envelope(cached, { cache_hit: true });
    }

    const data = await this.kpiDashboardService.listar(lojaId);
    this.homeCacheService.gravar(chave, data);
    return this.envelope(data, { cache_hit: false });
  }

  /**
   * GET /home-operacional/resumo-financeiro
   *
   * Bloco 4 do dashboard (Fase 6.C). Retorna os 5 indicadores principais
   * + count e valor de cobrancas vencidas.
   *
   * Decisao Fase 0 (doc 07-permissoes-home.md): o front so renderiza
   * quando o usuario tem `home-operacional.ver_resumo_financeiro`. O
   * backend retorna o dado para qualquer JWT autenticado (validacao
   * fina sera adicionada quando o sistema de perfis estiver populado).
   *
   * Cache: 60s, usa o `ResumoFinanceiroService` interno.
   * `?refresh=1` para forcar recomputacao.
   */
  @Get('resumo-financeiro')
  async resumoFinanceiro(
    @CurrentLojaId() lojaId: string,
    @Query('refresh') refresh?: string,
  ) {
    const bypass = refresh === '1' || refresh === 'true';
    return this.resumoFinanceiroService.obterResumo(lojaId, bypass);
  }

  /**
   * GET /home-operacional/contadores-menu
   *
   * Badges do menu lateral: itens NOVOS desde a última visita ao módulo.
   * Query: os_desde, pcp_desde, expedicao_desde, financeiro_desde, arte_desde (ISO 8601).
   * Cache: 60s por loja + timestamps. `?refresh=1` força recomputação.
   */
  @Get('contadores-menu')
  async contadoresMenu(
    @CurrentLojaId() lojaId: string,
    @Query('refresh') refresh?: string,
    @Query('os_desde') osDesde?: string,
    @Query('pcp_desde') pcpDesde?: string,
    @Query('expedicao_desde') expedicaoDesde?: string,
    @Query('financeiro_desde') financeiroDesde?: string,
    @Query('arte_desde') arteDesde?: string,
  ) {
    const bypass = refresh === '1' || refresh === 'true';
    const data = await this.contadoresMenuService.obter(lojaId, {
      forcar: bypass,
      osDesde: this.parseDesdeQuery(osDesde),
      pcpDesde: this.parseDesdeQuery(pcpDesde),
      expedicaoDesde: this.parseDesdeQuery(expedicaoDesde),
      financeiroDesde: this.parseDesdeQuery(financeiroDesde),
      arteDesde: this.parseDesdeQuery(arteDesde),
    });
    return this.envelope(data);
  }

  private parseDesdeQuery(valor?: string): Date | undefined {
    if (!valor?.trim()) return undefined;
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? undefined : data;
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
