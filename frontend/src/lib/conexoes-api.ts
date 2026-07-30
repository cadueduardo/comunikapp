import {
  buildClientAuthHeaders,
  hasClientSession,
} from '@/lib/session-auth';

export type LojaConexaoStatus =
  | 'DESCONECTADO'
  | 'CONECTADO'
  | 'PENDENTE'
  | 'ERRO';

export type LojaConexaoTipo = 'GOOGLE_DRIVE' | 'WHATSAPP_EVOLUTION';

export interface LojaConexaoPublica {
  tipo: LojaConexaoTipo;
  status: LojaConexaoStatus;
  google_email?: string;
  google_name?: string;
  connected_at?: string;
  mensagem_erro?: string;
}

function assertSession(): void {
  if (!hasClientSession()) {
    throw new Error('Sessão expirada');
  }
}

export async function fetchConexoes(): Promise<LojaConexaoPublica[]> {
  assertSession();
  const res = await fetch('/api/conexoes', {
    headers: buildClientAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Erro ao carregar conexões');
  }
  return json.data ?? [];
}

export async function iniciarGoogleOAuth(): Promise<string> {
  assertSession();
  const res = await fetch('/api/conexoes/google/auth', {
    headers: buildClientAuthHeaders(),
    credentials: 'include',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Erro ao iniciar conexão Google');
  }
  return json.data?.url as string;
}

export async function desconectarGoogle(): Promise<void> {
  assertSession();
  const res = await fetch('/api/conexoes/google', {
    method: 'DELETE',
    headers: buildClientAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || json.error || 'Erro ao desconectar Google Drive');
  }
}
