import type {
  EnderecoLoteForm,
  LoteInstaladorDetalhe,
  LoteInstaladorResumo,
  OcorrenciaInstalador,
  ResultadoBuscaCep,
} from './instalacao.types';

export class InstaladorApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'InstaladorApiError';
  }
}

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

export const instaladorApi = {
  async listarLotes(): Promise<LoteInstaladorResumo[]> {
    const response = await fetch('/api/instalador/lotes', {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async obterLote(id: string): Promise<LoteInstaladorDetalhe> {
    const response = await fetch(`/api/instalador/lotes/${id}`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async iniciarLote(id: string): Promise<{ id: string; status_instalacao: string }> {
    const response = await fetch(`/api/instalador/lotes/${id}/iniciar`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async concluirLote(
    id: string,
    dados: { fotos_evidencia?: string[]; assinatura_url?: string },
  ): Promise<unknown> {
    const response = await fetch(`/api/instalador/lotes/${id}/concluir`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });
    return tratarResposta(response);
  },

  async atualizarEndereco(
    id: string,
    dados: EnderecoLoteForm,
  ): Promise<unknown> {
    const response = await fetch(`/api/instalador/lotes/${id}/endereco`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        cep: dados.cep,
        logradouro: dados.logradouro,
        numero: dados.numero,
        complemento: dados.complemento || undefined,
        bairro: dados.bairro,
        cidade: dados.cidade,
        uf: dados.uf,
        quantidade_alocada: dados.quantidade_alocada,
      }),
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
  }): Promise<OcorrenciaInstalador> {
    const response = await fetch('/api/instalador/ocorrencias', {
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

  async uploadAnexo(arquivo: File): Promise<{ url: string; token: string }> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    const response = await fetch('/api/instalador/anexos/upload', {
      method: 'POST',
      headers: getAuthHeadersSemContentType(),
      body: formData,
    });
    return tratarResposta(response);
  },
};
