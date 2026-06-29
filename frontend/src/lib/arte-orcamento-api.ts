import {
  FinalidadeAnexoValor,
  PoliticaCobrancaArteValor,
  ResponsabilidadeArteValor,
} from './arte-orcamento.constants';

export interface ArteConfiguracaoStatus {
  configurado: boolean;
  alerta?: string;
}

export interface ArteConfiguracaoLoja {
  cobranca_padrao: PoliticaCobrancaArteValor;
  horas_padrao_criacao: number;
  horas_padrao_adaptacao: number;
  permitir_edicao_orcamentista: boolean;
}

export interface SyncArteProdutoPayload {
  responsabilidade_arte?: ResponsabilidadeArteValor;
  politica_cobranca_arte?: PoliticaCobrancaArteValor;
  finalidade_anexo?: FinalidadeAnexoValor | null;
  complexidade_arte?: string | null;
  servicos?: Array<Record<string, unknown>>;
}

export interface SyncArteProdutoResult {
  servicos: Array<Record<string, unknown>>;
  alertas: string[];
  arte_custo_automatico: boolean;
  arte_horas_calculadas: number | null;
  arte_custo_calculado: number | null;
  arte_referencia_servico_id: string | null;
}

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchArteConfiguracaoStatus(): Promise<ArteConfiguracaoStatus> {
  const res = await fetch('/api/arte-aprovacao/configuracao/status', {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Erro ao carregar status de arte');
  }
  return json.data as ArteConfiguracaoStatus;
}

export async function fetchArteConfiguracaoLoja(): Promise<ArteConfiguracaoLoja> {
  const res = await fetch('/api/arte-aprovacao/configuracao', {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Erro ao carregar configuração de arte');
  }
  return json.data as ArteConfiguracaoLoja;
}

export async function syncArteProdutoOrcamento(
  payload: SyncArteProdutoPayload,
): Promise<SyncArteProdutoResult> {
  const res = await fetch('/api/arte-aprovacao/orcamento/sync-produto', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Erro ao sincronizar arte do produto');
  }
  return json.data as SyncArteProdutoResult;
}
