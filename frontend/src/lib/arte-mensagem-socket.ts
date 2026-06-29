/** Normaliza payload do evento `nova_mensagem_arte` (pode vir aninhado). */
export function normalizeArteMensagemSocketPayload(
  data: unknown,
): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as { mensagem?: unknown };
  const msg = root.mensagem;
  if (msg && typeof msg === 'object') {
    return msg as Record<string, unknown>;
  }
  return data as Record<string, unknown>;
}

export function mapArteMensagemSocketToUi(
  msg: Record<string, unknown>,
  autorFallback = 'Usuário',
): {
  id: string;
  autor: string;
  autorTipo: 'cliente' | 'equipe';
  mensagem: string;
  data: string;
  lida: boolean;
} {
  const autorTipoRaw = String(msg.autor_tipo || '').toLowerCase();
  return {
    id: String(msg.id || `tmp-${Date.now()}`),
    autor: String(msg.autor_nome || autorFallback),
    autorTipo: autorTipoRaw === 'cliente' ? 'cliente' : 'equipe',
    mensagem: String(msg.mensagem || ''),
    data: String(msg.created_at || new Date().toISOString()),
    lida: Boolean(msg.lida),
  };
}
