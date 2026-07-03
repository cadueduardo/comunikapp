import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertasOperacionaisService } from './alertas-operacionais.service';
import { HomeCacheService } from './home-cache.service';
import { KPI, KpisResumo } from '../interfaces/kpi.interface';
import { AlertasResponseData } from '../interfaces/alerta.interface';
import { filtroOsElegivelFluxoPcp } from '../../pcp/utils/os-elegivel-pcp-kanban.util';

// Status considerados "OS em producao" para o KPI - inclui todas as
// situacoes posteriores a aprovacao tecnica e anteriores ao FINALIZADA.
const STATUS_OS_PRODUCAO = [
  'APROVADA_TECNICA',
  'LIBERADA_PARA_PCP',
  'PRODUCAO',
  'ACABAMENTO',
  'AGUARDANDO_MATERIAL',
];

// Status de orcamento em aberto - antes da aprovacao final.
const STATUS_ORCAMENTOS_ABERTOS = ['rascunho', 'em_analise'];

@Injectable()
export class KpiDashboardService {
  private readonly logger = new Logger(KpiDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertasService: AlertasOperacionaisService,
    private readonly cache: HomeCacheService,
  ) {}

  async listar(lojaId: string): Promise<KpisResumo> {
    const periodo = this.calcularPeriodoMes();

    const [orcAbertos, totalMes, osProducao, criticos] = await Promise.all([
      this.contarOrcamentosAbertos(lojaId),
      this.somarTotalOrcadoMes(lojaId, periodo),
      this.contarOsEmProducao(lojaId),
      this.contarAlertasCriticos(lojaId),
    ]);

    const kpis: KPI[] = [
      {
        id: 'orcamentos_abertos',
        label: 'Orçamentos abertos',
        valor: orcAbertos,
        formato: 'numero',
        cor: 'blue',
        icone: 'orcamento',
        hint: 'em rascunho ou em análise',
        link: { label: 'Ver orçamentos', href: '/orcamentos-v2' },
      },
      {
        id: 'total_orcado_mes',
        label: 'Total orçado no mês',
        valor: totalMes,
        formato: 'moeda',
        cor: 'emerald',
        icone: 'dinheiro',
        hint: this.descreverMes(periodo.inicio),
        link: { label: 'Ver orçamentos', href: '/orcamentos-v2' },
      },
      {
        id: 'os_em_producao',
        label: 'OS em produção',
        valor: osProducao,
        formato: 'numero',
        cor: 'amber',
        icone: 'producao',
        hint: 'aprovadas tecnicamente até prontas',
        link: { label: 'Ver OS', href: '/os' },
      },
      {
        id: 'alertas_criticos',
        label: 'Alertas críticos',
        valor: criticos,
        formato: 'numero',
        cor: criticos > 0 ? 'red' : 'zinc',
        icone: 'alerta',
        hint:
          criticos > 0
            ? 'pendências que impactam produção'
            : 'sem pendências críticas',
      },
    ];

    return {
      kpis,
      periodo_mes: {
        inicio: periodo.inicio.toISOString(),
        fim: periodo.fim.toISOString(),
      },
    };
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------

  private async contarOrcamentosAbertos(lojaId: string): Promise<number> {
    try {
      return await this.prisma.orcamento.count({
        where: {
          loja_id: lojaId,
          status: { in: STATUS_ORCAMENTOS_ABERTOS },
        },
      });
    } catch (error) {
      this.logger.warn(
        `contarOrcamentosAbertos falhou: ${this.descreverErro(error)}`,
      );
      return 0;
    }
  }

  private async somarTotalOrcadoMes(
    lojaId: string,
    periodo: { inicio: Date; fim: Date },
  ): Promise<number> {
    try {
      const resultado = await this.prisma.orcamento.aggregate({
        where: {
          loja_id: lojaId,
          criado_em: { gte: periodo.inicio, lt: periodo.fim },
        },
        _sum: { preco_final: true },
      });
      const soma = resultado._sum.preco_final;
      if (!soma) return 0;
      // preco_final e Prisma Decimal - converter para number seguro.
      const valor = (
        soma as unknown as { toNumber?: () => number }
      ).toNumber?.();
      if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
      const n = Number(soma);
      return Number.isFinite(n) ? n : 0;
    } catch (error) {
      this.logger.warn(
        `somarTotalOrcadoMes falhou: ${this.descreverErro(error)}`,
      );
      return 0;
    }
  }

  private async contarOsEmProducao(lojaId: string): Promise<number> {
    try {
      return await this.prisma.ordemServico.count({
        where: {
          loja_id: lojaId,
          status: { in: STATUS_OS_PRODUCAO },
          ...filtroOsElegivelFluxoPcp,
        },
      });
    } catch (error) {
      this.logger.warn(
        `contarOsEmProducao falhou: ${this.descreverErro(error)}`,
      );
      return 0;
    }
  }

  private async contarAlertasCriticos(lojaId: string): Promise<number> {
    // Reutiliza o cache de alertas (mesma chave `alertas:<lojaId>`) -
    // como os 2 endpoints (kpis e alertas) sao chamados em paralelo pela
    // pagina, o cache fica quente na maioria dos hits.
    try {
      const chave = `alertas:${lojaId}`;
      const cached = this.cache.obter<AlertasResponseData>(chave, false);
      if (cached) return cached.por_nivel.critico;

      const fresh = await this.alertasService.listar(lojaId);
      this.cache.gravar(chave, fresh);
      return fresh.por_nivel.critico;
    } catch (error) {
      this.logger.warn(
        `contarAlertasCriticos falhou: ${this.descreverErro(error)}`,
      );
      return 0;
    }
  }

  private calcularPeriodoMes(): { inicio: Date; fim: Date } {
    const agora = new Date();
    const inicio = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const fim = new Date(
      agora.getFullYear(),
      agora.getMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    );
    return { inicio, fim };
  }

  private descreverMes(data: Date): string {
    const nomes = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ];
    return `${nomes[data.getMonth()]}/${data.getFullYear()}`;
  }

  private descreverErro(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
