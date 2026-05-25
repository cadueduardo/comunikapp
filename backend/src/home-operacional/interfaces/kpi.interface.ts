/**
 * Tipos do endpoint GET /home-operacional/kpis.
 *
 * Os KPIs sao 4 cartoes estatisticos exibidos no topo do dashboard
 * operacional. Eles consolidam contagens e somas que ja sao consultadas
 * por outros endpoints (fluxo, alertas) mas em formato achatado para
 * leitura rapida.
 */

export type FormatoKPI = 'numero' | 'moeda';

export type CorKPI = 'zinc' | 'blue' | 'amber' | 'emerald' | 'red';

export type IconeKPI = 'orcamento' | 'dinheiro' | 'producao' | 'alerta';

export interface KPI {
  id: 'orcamentos_abertos' | 'total_orcado_mes' | 'os_em_producao' | 'alertas_criticos';
  label: string;
  valor: number;
  formato: FormatoKPI;
  cor: CorKPI;
  icone: IconeKPI;
  // Subtitulo curto (ex.: "este mes", "aguardando OS").
  hint?: string;
  link?: { label: string; href: string };
}

export interface KpisResumo {
  kpis: KPI[];
  // Periodo considerado para metricas mensais; util para legenda no
  // frontend ("Maio/2026", "este mes" etc.).
  periodo_mes: {
    inicio: string;
    fim: string;
  };
}
