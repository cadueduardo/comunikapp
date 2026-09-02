import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentLojaId, Identidade } from '../auth/decorators';
import type { IdentidadeAutenticada } from '../auth/decorators';
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
import { PermissaoEfetivaService } from '../rbac/autorizacao/permissao-efetiva.service';
import {
  type AcessoModulos,
  ONBOARDING_DESABILITADO,
  podeModulo,
} from './home-visibilidade';

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
    private readonly permissaoEfetiva: PermissaoEfetivaService,
  ) {}

  private async acessoDe(
    identidade: IdentidadeAutenticada,
  ): Promise<AcessoModulos> {
    return this.permissaoEfetiva.listarAcessoModulos(
      identidade.usuarioId,
      identidade.lojaId,
    );
  }

  private chaveCache(
    prefixo: string,
    identidade: IdentidadeAutenticada,
  ): string {
    return `${prefixo}:${identidade.lojaId}:${identidade.usuarioId}`;
  }

  private assertPodeConfigurar(acesso: AcessoModulos): void {
    if (!podeModulo(acesso, 'configuracoes')) {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      );
    }
  }

  @Get('onboarding')
  async obterOnboarding(@Identidade() identidade: IdentidadeAutenticada) {
    const acesso = await this.acessoDe(identidade);
    if (!podeModulo(acesso, 'configuracoes')) {
      return this.envelope({ ...ONBOARDING_DESABILITADO });
    }
    const data = await this.onboardingService.obterResumo(identidade.lojaId);
    return this.envelope({ ...data, habilitado: true });
  }

  @Patch('onboarding/:stepId')
  async atualizarStep(
    @Identidade() identidade: IdentidadeAutenticada,
    @Param('stepId') stepId: string,
    @Body() dto: AtualizarOnboardingStepDto,
  ) {
    this.assertPodeConfigurar(await this.acessoDe(identidade));
    const data = await this.onboardingService.atualizarStep(
      identidade.lojaId,
      stepId,
      dto.acao,
    );
    return this.envelope({ ...data, habilitado: true });
  }

  @Post('onboarding/aplicar-configuracao-recomendada')
  async aplicarConfiguracaoRecomendada(
    @Identidade() identidade: IdentidadeAutenticada,
    @Body() dto: AplicarConfiguracaoRecomendadaDto,
  ) {
    this.assertPodeConfigurar(await this.acessoDe(identidade));
    const data = await this.configuracaoRecomendadaService.aplicar(
      identidade.lojaId,
      {
        sobrescreverExistentes: dto.sobrescrever_existentes === true,
      },
    );
    return this.envelope(data);
  }

  @Post('onboarding/aplicar-entrega-instalacao')
  async aplicarEntregaInstalacao(
    @Identidade() identidade: IdentidadeAutenticada,
  ) {
    this.assertPodeConfigurar(await this.acessoDe(identidade));
    const data =
      await this.configuracaoRecomendadaService.aplicarSomenteEntregaInstalacao(
        identidade.lojaId,
      );
    return this.envelope(data);
  }

  @Get('banner-estado')
  async banner(@Identidade() identidade: IdentidadeAutenticada) {
    const acesso = await this.acessoDe(identidade);
    const mensagens = await this.systemStateService.listarMensagens(
      identidade.lojaId,
      podeModulo(acesso, 'configuracoes'),
    );
    return this.envelope({ mensagens });
  }

  /**
   * GET /home-operacional/fluxo
   *
   * Agregador de cards por estagio do trabalho. Contrato em
   * docs/fase-0-home-operacional/02-contratos-home-operacional.md secao 5.
   *
   * Cache: 60s por `loja_id` + `usuario_id` (o recorte de colunas
   * depende do perfil). Use `?refresh=1` para forcar recomputacao.
   */
  @Get('fluxo')
  async fluxo(
    @Identidade() identidade: IdentidadeAutenticada,
    @Query('refresh') refresh?: string,
  ) {
    const chave = this.chaveCache('fluxo', identidade);
    const bypass = refresh === '1' || refresh === 'true';
    const acesso = await this.acessoDe(identidade);

    const cached = this.homeCacheService.obter<FluxoResponseData>(
      chave,
      bypass,
    );
    if (cached) {
      return this.envelope(cached, { cache_hit: true });
    }

    const data = await this.fluxoTrabalhoService.montarFluxo(
      identidade.lojaId,
      acesso,
    );
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
   * Cache: 60s por `loja_id` + `usuario_id`. Use `?refresh=1` para forcar recomputacao.
   */
  @Get('alertas')
  async alertas(
    @Identidade() identidade: IdentidadeAutenticada,
    @Query('refresh') refresh?: string,
  ) {
    const chave = this.chaveCache('alertas', identidade);
    const bypass = refresh === '1' || refresh === 'true';
    const acesso = await this.acessoDe(identidade);

    const cached = this.homeCacheService.obter<AlertasResponseData>(
      chave,
      bypass,
    );
    if (cached) {
      return this.envelope(cached, { cache_hit: true });
    }

    const data = await this.alertasOperacionaisService.listar(
      identidade.lojaId,
      acesso,
    );
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
   * Cache: 60s por `loja_id` + `usuario_id`. Use `?refresh=1` para forçar
   * recomputação.
   */
  @Get('kpis')
  async kpis(
    @Identidade() identidade: IdentidadeAutenticada,
    @Query('refresh') refresh?: string,
  ) {
    const chave = this.chaveCache('kpis', identidade);
    const bypass = refresh === '1' || refresh === 'true';
    const acesso = await this.acessoDe(identidade);

    const cached = this.homeCacheService.obter<KpisResumo>(chave, bypass);
    if (cached) {
      return this.envelope(cached, { cache_hit: true });
    }

    const data = await this.kpiDashboardService.listar(
      identidade.lojaId,
      acesso,
    );
    this.homeCacheService.gravar(chave, data);
    return this.envelope(data, { cache_hit: false });
  }

  /**
   * GET /home-operacional/resumo-financeiro
   *
   * Bloco 4 do dashboard (Fase 6.C). Retorna os 5 indicadores principais
   * + count e valor de cobrancas vencidas.
   *
   * Só devolve números com `financeiro.acessar`. Sem a porta, 403.
   *
   * Cache: 60s, usa o `ResumoFinanceiroService` interno.
   * `?refresh=1` para forcar recomputacao.
   */
  @Get('resumo-financeiro')
  async resumoFinanceiro(
    @Identidade() identidade: IdentidadeAutenticada,
    @Query('refresh') refresh?: string,
  ) {
    const acesso = await this.acessoDe(identidade);
    if (!podeModulo(acesso, 'financeiro')) {
      throw new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      );
    }
    const bypass = refresh === '1' || refresh === 'true';
    return this.resumoFinanceiroService.obterResumo(identidade.lojaId, bypass);
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
    @Query('refresh') refresh?: string | string[],
    @Query('os_desde') osDesde?: string | string[],
    @Query('pcp_desde') pcpDesde?: string | string[],
    @Query('expedicao_desde') expedicaoDesde?: string | string[],
    @Query('financeiro_desde') financeiroDesde?: string | string[],
    @Query('arte_desde') arteDesde?: string | string[],
    @Query('instalacao_desde') instalacaoDesde?: string | string[],
  ) {
    const bypassRaw = Array.isArray(refresh) ? refresh[0] : refresh;
    const bypass = bypassRaw === '1' || bypassRaw === 'true';
    const data = await this.contadoresMenuService.obter(lojaId, {
      forcar: bypass,
      osDesde: this.parseDesdeQuery(osDesde),
      pcpDesde: this.parseDesdeQuery(pcpDesde),
      expedicaoDesde: this.parseDesdeQuery(expedicaoDesde),
      financeiroDesde: this.parseDesdeQuery(financeiroDesde),
      arteDesde: this.parseDesdeQuery(arteDesde),
      instalacaoDesde: this.parseDesdeQuery(instalacaoDesde),
    });
    return this.envelope(data);
  }

  private parseDesdeQuery(valor?: string | string[]): Date | undefined {
    const bruto = Array.isArray(valor) ? valor[0] : valor;
    if (!bruto?.trim()) return undefined;
    const data = new Date(bruto);
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
