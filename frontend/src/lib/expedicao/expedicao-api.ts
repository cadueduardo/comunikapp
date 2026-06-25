import type {
  ArquivarExpedicaoResult,
  ConcluirEntregaPayload,
  ConcluirEntregaResult,
  ExpedicaoDetalhe,
  ExpedicaoKanbanFilters,
  ExpedicaoKanbanResponse,
  StatusExpedicao,
  TransformarTemplateResult,
  UploadAssinaturaResult,
} from './expedicao.types';
import { ExpedicaoApiError } from './expedicao-api-error';

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

function montarQuery(filtros?: ExpedicaoKanbanFilters): string {
  const params = new URLSearchParams();
  if (filtros?.status) params.set('status', filtros.status);
  if (filtros?.modalidade) params.set('modalidade', filtros.modalidade);
  if (filtros?.busca?.trim()) params.set('busca', filtros.busca.trim());
  if (filtros?.incluir_arquivados) {
    params.set('incluir_arquivados', 'true');
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function tratarResposta<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
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

  throw new ExpedicaoApiError(message, response.status, body);
}

export const expedicaoApi = {
  async listarKanban(
    filtros?: ExpedicaoKanbanFilters,
  ): Promise<ExpedicaoKanbanResponse> {
    const response = await fetch(`/api/expedicao${montarQuery(filtros)}`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async listarArquivo(
    filtros?: ExpedicaoKanbanFilters,
  ): Promise<ExpedicaoKanbanResponse> {
    const response = await fetch(
      `/api/expedicao/arquivo${montarQuery(filtros)}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return tratarResposta(response);
  },

  async obterDetalhe(expedicaoId: string): Promise<ExpedicaoDetalhe> {
    const response = await fetch(`/api/expedicao/${expedicaoId}`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async obterDetalhePorOs(osId: string): Promise<ExpedicaoDetalhe> {
    const response = await fetch(`/api/expedicao/os/${osId}`, {
      headers: getAuthHeaders(),
    });
    return tratarResposta(response);
  },

  async atualizarStatus(
    expedicaoId: string,
    status: StatusExpedicao,
  ): Promise<void> {
    const response = await fetch(`/api/expedicao/${expedicaoId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    await tratarResposta(response);
  },

  async devolverProducao(
    expedicaoId: string,
    motivo: string,
  ): Promise<{ expedicao_id: string; os_id: string; workflow_reativado: boolean }> {
    const response = await fetch(
      `/api/expedicao/${expedicaoId}/devolver-producao`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ motivo }),
      },
    );
    return tratarResposta(response);
  },

  async concluirEntrega(
    expedicaoId: string,
    payload: ConcluirEntregaPayload,
  ): Promise<ConcluirEntregaResult> {
    const response = await fetch(
      `/api/expedicao/${expedicaoId}/concluir-entrega`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      },
    );
    return tratarResposta(response);
  },

  async arquivar(
    expedicaoId: string,
    observacoes?: string,
  ): Promise<ArquivarExpedicaoResult> {
    const response = await fetch(`/api/expedicao/${expedicaoId}/arquivar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(
        observacoes ? { observacoes } : {},
      ),
    });
    return tratarResposta(response);
  },

  async transformarTemplate(
    osId: string,
    nome: string,
  ): Promise<TransformarTemplateResult> {
    const response = await fetch(
      `/api/expedicao/os/${osId}/transformar-template`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nome }),
      },
    );
    return tratarResposta(response);
  },

  async uploadAssinatura(blob: Blob): Promise<UploadAssinaturaResult> {
    const formData = new FormData();
    formData.append(
      'arquivo',
      blob,
      `assinatura-${Date.now()}.png`,
    );

    const response = await fetch('/api/expedicao/assinaturas/upload', {
      method: 'POST',
      headers: getAuthHeadersSemContentType(),
      body: formData,
    });
    return tratarResposta(response);
  },
};
