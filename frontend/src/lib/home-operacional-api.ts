import { apiRequest } from './api';

// ====================================================================
// Tipos compartilhados com o backend (modulo home-operacional / Fase 1)
// Mantidos manualmente em sincronia com:
//   backend/src/home-operacional/interfaces/onboarding.interface.ts
//   backend/src/home-operacional/services/system-state.service.ts
// ====================================================================

export type OnboardingStatus = 'pendente' | 'concluido' | 'ignorado' | 'atencao';

export interface OnboardingEtapaEstado {
  step_id: string;
  titulo: string;
  descricao_curta: string;
  acao_label: string;
  acao_href: string;
  obrigatoria: boolean;
  status: OnboardingStatus;
  concluido_em: string | null;
  ignorado_em: string | null;
}

export interface OnboardingResumo {
  progresso_pct: number;
  total_etapas: number;
  total_obrigatorias: number;
  obrigatorias_concluidas: number;
  etapas: OnboardingEtapaEstado[];
}

export type BannerNivel = 'critico' | 'atencao' | 'informativo';

export interface BannerAcaoLink {
  tipo: 'link';
  label: string;
  href: string;
}

export interface BannerAcaoEndpoint {
  tipo: 'endpoint';
  label: string;
  metodo: 'POST' | 'PATCH';
  endpoint: string;
}

export type BannerAcao = BannerAcaoLink | BannerAcaoEndpoint;

export interface BannerMensagem {
  id: string;
  nivel: BannerNivel;
  titulo: string;
  descricao?: string;
  acao?: BannerAcao;
  dismissable: boolean;
  prioridade: number;
}

export interface AplicarConfiguracaoRecomendadaResposta {
  aplicado: {
    loja: Record<string, unknown>;
    categorias_criadas: string[];
    tipos_material_criados: string[];
    setores_criados: string[];
    modalidades_entrega_criadas: string[];
    tipos_instalacao_criados: string[];
    workflow_criado: string | null;
    regras_validacao_criadas: number;
  };
  ignorado: {
    loja: string[];
    categorias?: string;
    tipos_material?: string;
    setores?: string;
    modalidades_entrega?: string;
    tipos_instalacao?: string;
    workflow?: string;
  };
  etapas_marcadas_concluidas: string[];
}

interface Envelope<T> {
  data: T;
  meta: { gerado_em: string; cache_hit: boolean };
}

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let mensagem = `Erro HTTP ${response.status}`;
    try {
      const erro = await response.json();
      if (erro?.message) {
        mensagem = Array.isArray(erro.message) ? erro.message.join(' | ') : String(erro.message);
      }
    } catch {
      // ignora
    }
    throw new Error(mensagem);
  }
  const body = (await response.json()) as Envelope<T>;
  return body.data;
}

// ====================================================================
// Endpoints
// ====================================================================

export async function fetchOnboarding(): Promise<OnboardingResumo> {
  const r = await apiRequest('/home-operacional/onboarding', { method: 'GET' });
  return unwrap<OnboardingResumo>(r);
}

export async function patchOnboardingStep(
  stepId: string,
  acao: 'ignorar' | 'reativar',
): Promise<OnboardingResumo> {
  const r = await apiRequest(`/home-operacional/onboarding/${encodeURIComponent(stepId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ acao }),
  });
  return unwrap<OnboardingResumo>(r);
}

export async function postAplicarConfiguracaoRecomendada(opcoes?: {
  sobrescrever_existentes?: boolean;
}): Promise<AplicarConfiguracaoRecomendadaResposta> {
  const r = await apiRequest('/home-operacional/onboarding/aplicar-configuracao-recomendada', {
    method: 'POST',
    body: JSON.stringify({
      confirmar: true,
      sobrescrever_existentes: opcoes?.sobrescrever_existentes === true,
    }),
  });
  return unwrap<AplicarConfiguracaoRecomendadaResposta>(r);
}

export async function postAplicarEntregaInstalacao(): Promise<AplicarConfiguracaoRecomendadaResposta> {
  const r = await apiRequest('/home-operacional/onboarding/aplicar-entrega-instalacao', {
    method: 'POST',
    body: JSON.stringify({ confirmar: true }),
  });
  return unwrap<AplicarConfiguracaoRecomendadaResposta>(r);
}

export async function fetchBannerEstado(): Promise<BannerMensagem[]> {
  const r = await apiRequest('/home-operacional/banner-estado', { method: 'GET' });
  const data = await unwrap<{ mensagens: BannerMensagem[] }>(r);
  return data.mensagens;
}

// ====================================================================
// Fluxo de trabalho (Fase 4)
//
// Mantenha sincronizado com:
//   backend/src/home-operacional/interfaces/fluxo.interface.ts
// ====================================================================

export type TipoCardFluxo = 'orcamento' | 'os' | 'item_os' | 'cobranca';

export type StatusColunaFluxo = 'ativa' | 'aguardando_modulo';

export type IdColunaFluxo =
  | 'orcamentos'
  | 'aprovados'
  | 'revisao_tecnica'
  | 'producao'
  | 'prontos'
  | 'a_receber'
  | 'concluidos';

export interface AcaoCardFluxo {
  id: string;
  label: string;
  href?: string;
  endpoint?: string;
}

export interface CardFluxo {
  id: string;
  tipo: TipoCardFluxo;
  titulo: string;
  subtitulo?: string;
  status_label?: string;
  valor?: number;
  atualizado_em: string;
  acoes: AcaoCardFluxo[];
}

export interface ColunaFluxo {
  id: IdColunaFluxo;
  label: string;
  total: number;
  cards: CardFluxo[];
  status: StatusColunaFluxo;
  aviso?: string;
}

export interface FluxoResumo {
  colunas: ColunaFluxo[];
}

export async function fetchFluxo(opcoes?: {
  refresh?: boolean;
}): Promise<FluxoResumo> {
  const qs = opcoes?.refresh ? '?refresh=1' : '';
  const r = await apiRequest(`/home-operacional/fluxo${qs}`, { method: 'GET' });
  return unwrap<FluxoResumo>(r);
}

// ====================================================================
// Alertas operacionais (Fase 5)
//
// Mantenha sincronizado com:
//   backend/src/home-operacional/interfaces/alerta.interface.ts
// ====================================================================

export type NivelAlerta = 'critico' | 'atencao' | 'informativo';

export type OrigemAlerta =
  | 'orcamentos'
  | 'os'
  | 'estoque'
  | 'financeiro'
  | 'pcp';

export interface AcaoAlertaLink {
  tipo: 'link';
  label: string;
  href: string;
}

export interface AcaoAlertaEndpoint {
  tipo: 'endpoint';
  label: string;
  metodo: 'POST' | 'PATCH' | 'GET';
  endpoint: string;
}

export type AcaoAlerta = AcaoAlertaLink | AcaoAlertaEndpoint;

export interface Alerta {
  id: string;
  nivel: NivelAlerta;
  titulo: string;
  descricao?: string;
  origem: OrigemAlerta;
  criado_em: string;
  acao?: AcaoAlerta;
}

export interface AlertasPorNivel {
  critico: number;
  atencao: number;
  informativo: number;
}

export interface AlertasResumo {
  total: number;
  por_nivel: AlertasPorNivel;
  alertas: Alerta[];
}

export async function fetchAlertas(opcoes?: {
  refresh?: boolean;
}): Promise<AlertasResumo> {
  const qs = opcoes?.refresh ? '?refresh=1' : '';
  const r = await apiRequest(`/home-operacional/alertas${qs}`, {
    method: 'GET',
  });
  return unwrap<AlertasResumo>(r);
}

// ====================================================================
// KPIs do dashboard (Fase 4/5 - melhoria visual)
//
// Mantenha sincronizado com:
//   backend/src/home-operacional/interfaces/kpi.interface.ts
// ====================================================================

export type FormatoKPI = 'numero' | 'moeda';

export type CorKPI = 'zinc' | 'blue' | 'amber' | 'emerald' | 'red';

export type IconeKPI = 'orcamento' | 'dinheiro' | 'producao' | 'alerta';

export interface KPI {
  id:
    | 'orcamentos_abertos'
    | 'total_orcado_mes'
    | 'os_em_producao'
    | 'alertas_criticos';
  label: string;
  valor: number;
  formato: FormatoKPI;
  cor: CorKPI;
  icone: IconeKPI;
  hint?: string;
  link?: { label: string; href: string };
}

export interface KpisResumo {
  kpis: KPI[];
  periodo_mes: {
    inicio: string;
    fim: string;
  };
}

export async function fetchKpis(opcoes?: {
  refresh?: boolean;
}): Promise<KpisResumo> {
  const qs = opcoes?.refresh ? '?refresh=1' : '';
  const r = await apiRequest(`/home-operacional/kpis${qs}`, { method: 'GET' });
  return unwrap<KpisResumo>(r);
}

// ====================================================================
// Resumo Financeiro Simples (Fase 6.C - Bloco 4)
//
// Mantenha sincronizado com:
//   backend/src/home-operacional/interfaces/resumo-financeiro.interface.ts
// ====================================================================

export interface ResumoFinanceiroData {
  loja_id: string;
  periodo: string; // YYYY-MM
  /** null = sem dado; front esconde o indicador. */
  total_orcado_mes: number | null;
  total_aprovado_mes: number | null;
  valor_em_producao: number | null;
  valor_pronto_a_receber: number | null;
  valor_recebido_mes: number | null;
  cobrancas_vencidas: number;
  valor_vencido: number;
}

export interface ResumoFinanceiroResponse {
  data: ResumoFinanceiroData;
  meta: {
    calculado_em: string;
    cached: boolean;
  };
}

export async function fetchResumoFinanceiro(opcoes?: {
  refresh?: boolean;
}): Promise<ResumoFinanceiroResponse> {
  const qs = opcoes?.refresh ? '?refresh=1' : '';
  const r = await apiRequest(`/home-operacional/resumo-financeiro${qs}`, {
    method: 'GET',
  });
  // Este endpoint NAO usa o envelope `unwrap` (retorna { data, meta } com
  // shape proprio onde `data.loja_id`, etc).
  if (!r.ok) {
    let detalhe = '';
    try {
      detalhe = await r.text();
    } catch {
      /* noop */
    }
    throw new Error(
      `Falha ao carregar resumo financeiro (HTTP ${r.status})${detalhe ? `: ${detalhe.slice(0, 160)}` : ''}`,
    );
  }
  const json = (await r.json()) as ResumoFinanceiroResponse;
  return json;
}
