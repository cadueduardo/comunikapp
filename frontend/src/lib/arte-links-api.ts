export interface ArteLinkAprovacao {
  id: string;
  token_publico: string;
  url_aprovacao: string;
  expira_em: string;
  ativo: boolean;
  versao_id: string;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Token de autenticação não encontrado');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function urlLinkPublicoLocal(token: string): string {
  if (typeof window === 'undefined') return `/arte/aprovacao/${token}`;
  return `${window.location.origin}/arte/aprovacao/${token}`;
}

export async function listarLinksVersao(
  versaoId: string,
): Promise<ArteLinkAprovacao[]> {
  const res = await fetch(`/api/arte-aprovacao/links/versao/${versaoId}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Erro ao listar links');
  }
  return (json.data || []).map((link: ArteLinkAprovacao) => ({
    ...link,
    url_aprovacao:
      link.url_aprovacao ||
      urlLinkPublicoLocal(link.token_publico),
  }));
}

export async function criarLinkVersao(
  versaoId: string,
  options?: { preview?: boolean; enviar_email?: boolean },
): Promise<ArteLinkAprovacao> {
  const res = await fetch('/api/arte-aprovacao/links', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      versao_id: versaoId,
      preview: options?.preview ?? false,
      enviar_email: options?.enviar_email,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Erro ao criar link');
  }
  const link = json.data as ArteLinkAprovacao;
  return {
    ...link,
    url_aprovacao:
      link.url_aprovacao || urlLinkPublicoLocal(link.token_publico),
  };
}

export async function resolverLinkPublicoVersao(
  versaoId: string,
  preview = false,
): Promise<string> {
  const links = await listarLinksVersao(versaoId).catch(() => []);
  const ativo = links.find(
    (l) =>
      l.ativo && new Date(l.expira_em).getTime() > Date.now(),
  );
  if (ativo) {
    return ativo.url_aprovacao || urlLinkPublicoLocal(ativo.token_publico);
  }

  const criado = await criarLinkVersao(versaoId, { preview });
  return criado.url_aprovacao;
}

export async function enviarVersaoParaCliente(
  versaoId: string,
): Promise<ArteLinkAprovacao> {
  return criarLinkVersao(versaoId, { preview: false, enviar_email: true });
}

export async function reenviarEmailAprovacao(
  osId: string,
  versaoId: string,
): Promise<{ previewUrl?: string | null }> {
  const res = await fetch(
    '/api/arte-aprovacao/notificacoes/aprovacao-solicitada',
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        tipo: 'APROVACAO_SOLICITADA',
        os_id: osId,
        versao_id: versaoId,
        destinatarios: [],
        dados: {},
      }),
    },
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Erro ao reenviar e-mail');
  }
  return { previewUrl: json.preview_url };
}
