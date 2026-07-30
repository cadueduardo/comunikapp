import { buildClientAuthHeaders, hasClientSession } from '@/lib/session-auth';
import { toast } from 'sonner';

export interface FilaArteItem {
  os_id: string;
  os_numero: string;
  os_nome_servico?: string;
  item_id: string;
  produto_nome: string;
  cliente_nome: string | null;
  status_arte: string;
  responsabilidade_arte: string;
  finalidade_anexo?: string | null;
  referencia_url?: string | null;
  geometria_origem?: string | null;
  prazo_os: string | null;
  prioridade_os?: string | null;
  designer_atribuido?: { id: string; nome: string } | null;
  arte_fila_desde?: string | null;
  /** Mensagens do cliente ainda não lidas pela equipe */
  mensagens_nao_lidas?: number;
}

function headersAuth(): Record<string, string> {
  return buildClientAuthHeaders({ 'Content-Type': 'application/json' });
}

function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
  });
}

export async function fetchFilaArte(params?: {
  modo?: 'me';
  limit?: number;
  status?: string;
}): Promise<{ data: FilaArteItem[]; meta?: { total?: number } }> {
  if (!hasClientSession()) {
    throw new Error('Sessão não encontrada. Faça login novamente.');
  }
  const qs = new URLSearchParams();
  if (params?.modo) qs.set('modo', params.modo);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);

  const url = `/api/arte-aprovacao/fila${qs.toString() ? `?${qs}` : ''}`;
  const resp = await apiFetch(url, { headers: headersAuth() });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json.message || json.error || 'Erro ao carregar fila de arte');
  }
  return { data: json.data || [], meta: json.meta };
}

export async function assumirItemFilaArte(itemId: string): Promise<void> {
  const resp = await apiFetch(`/api/arte-aprovacao/fila/${itemId}/assumir`, {
    method: 'POST',
    headers: headersAuth(),
  });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json.message || json.error || 'Não foi possível assumir o item');
  }
}

export async function atualizarStatusArteItem(
  itemId: string,
  statusArte: string,
): Promise<void> {
  const resp = await apiFetch(`/api/arte-aprovacao/fila/${itemId}/status`, {
    method: 'PATCH',
    headers: headersAuth(),
    body: JSON.stringify({ status_arte: statusArte }),
  });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json.message || json.error || 'Transição de status não permitida');
  }
}

export async function liberarArteItemParaPcp(itemId: string): Promise<void> {
  const resp = await apiFetch(`/api/arte-aprovacao/fila/${itemId}/liberar-pcp`, {
    method: 'POST',
    headers: headersAuth(),
  });
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json.message || json.error || 'Não foi possível liberar para PCP');
  }
}

export async function assumirOuAbrirItem(item: FilaArteItem): Promise<void> {
  const podeAssumir = ['AGUARDANDO_INICIO', 'EM_CRIACAO', 'REVISAO_SOLICITADA'].includes(
    item.status_arte,
  );
  if (item.status_arte === 'AGUARDANDO_INICIO') {
    try {
      await assumirItemFilaArte(item.item_id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao assumir item',
      );
      if (!podeAssumir) return;
    }
  }
}
