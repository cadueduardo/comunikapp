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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export async function fetchConexoes(): Promise<LojaConexaoPublica[]> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada');
  }

  const res = await fetch('/api/conexoes', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Erro ao carregar conexões');
  }
  return json.data ?? [];
}

export async function iniciarGoogleOAuth(): Promise<string> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada');
  }

  const res = await fetch('/api/conexoes/google/auth', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Erro ao iniciar conexão Google');
  }
  return json.data?.url as string;
}

export async function desconectarGoogle(): Promise<void> {
  const token = getToken();
  if (!token) {
    throw new Error('Sessão expirada');
  }

  const res = await fetch('/api/conexoes/google', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || json.error || 'Erro ao desconectar Google Drive');
  }
}
