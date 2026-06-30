import type {
  LoteGestao,
  MargemRealOs,
  PainelOsInstalacao,
  RelatorioTecnicoEmitido,
  RelatorioTecnicoResposta,
  ResultadoBuscaCep,
  SplitFiscalOs,
} from './instalacao.types';
import { InstaladorApiError } from './instalador-api';

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getAuthHeadersSemContentType(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function tratarResposta<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const message = Array.isArray(body.message)
    ? body.message.join(', ')
    : String(body.message || body.error || `Erro ${response.status}`);

  throw new InstaladorApiError(message, response.status, body);
}

export const instalacaoApi = {
  async listarLotes(): Promise<LoteGestao[]> {
    const response = await fetch('/api/instalacao/lotes', {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async obterPainelOs(osId: string): Promise<PainelOsInstalacao> {
    const response = await fetch(`/api/instalacao/os/${osId}/painel`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async atualizarLote(
    id: string,
    dados: {
      cep?: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      quantidade_alocada?: number;
    },
  ): Promise<unknown> {
    const response = await fetch(`/api/instalacao/lotes/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return tratarResposta(response);
  },

  async registrarOcorrencia(dados: {
    os_id: string;
    item_instalacao_id?: string;
    tipo: string;
    descricao: string;
    quantidade?: number;
    fotos_evidencia?: string[];
  }): Promise<unknown> {
    const response = await fetch('/api/instalacao/ocorrencias', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return tratarResposta(response);
  },

  async buscarCep(cep: string): Promise<ResultadoBuscaCep> {
    const cepLimpo = cep.replace(/\D/g, '');
    const response = await fetch(`/api/instalacao/cep/${cepLimpo}`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async obterMargemReal(osId: string): Promise<MargemRealOs> {
    const response = await fetch(`/api/instalacao/os/${osId}/margem-real`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async gerarRelatorioTecnico(osId: string): Promise<RelatorioTecnicoResposta> {
    const response = await fetch(`/api/instalacao/os/${osId}/relatorio-tecnico`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async obterSplitFiscal(osId: string): Promise<SplitFiscalOs> {
    const response = await fetch(`/api/instalacao/os/${osId}/split-fiscal`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async obterRelatorioEmitido(
    osId: string,
  ): Promise<RelatorioTecnicoEmitido | null> {
    const response = await fetch(
      `/api/instalacao/os/${osId}/relatorio-tecnico`,
      { headers: getAuthHeaders() },
    );
    if (response.status === 404) return null;
    return tratarResposta(response);
  },

  async abrirRelatorioPdf(pdfToken: string): Promise<void> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `/api/instalacao/relatorios/${pdfToken}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    if (!response.ok) {
      throw new Error('Não foi possível baixar o PDF do relatório.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  async uploadAnexo(arquivo: File): Promise<{ url: string; token: string }> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    const response = await fetch('/api/instalacao/anexos/upload', {
      method: 'POST',
      headers: getAuthHeadersSemContentType(),
      body: formData,
    });
    return tratarResposta(response);
  },
};
