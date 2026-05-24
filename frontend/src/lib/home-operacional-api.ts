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
    workflow_criado: string | null;
    regras_validacao_criadas: number;
  };
  ignorado: {
    loja: string[];
    categorias?: string;
    tipos_material?: string;
    setores?: string;
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

export async function fetchBannerEstado(): Promise<BannerMensagem[]> {
  const r = await apiRequest('/home-operacional/banner-estado', { method: 'GET' });
  const data = await unwrap<{ mensagens: BannerMensagem[] }>(r);
  return data.mensagens;
}
