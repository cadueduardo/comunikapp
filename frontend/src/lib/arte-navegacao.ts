/** URL do workspace de arte para um item de OS. */
export function urlArteWorkspace(osId: string, itemId: string): string {
  return `/arte/trabalho/${osId}/${itemId}`;
}

/** URL da fila de arte, opcionalmente filtrada por OS. */
export function urlArteFila(osId?: string): string {
  if (!osId) return '/arte';
  return `/arte?os=${encodeURIComponent(osId)}`;
}

/** Redireciona URL legada `?tab=arte-aprovacao` para o workspace ou fila. */
export async function resolverRedirectArteLegado(osId: string): Promise<string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;
  if (!token) return '/arte';

  try {
    const res = await fetch(`/api/arte-aprovacao/os/${osId}/itens-contexto`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    const itens = (json.data || []) as Array<{
      item_id: string;
      status_arte: string;
      responsabilidade_arte: string;
    }>;

    const pendente =
      itens.find(
        (i) =>
          ['EMPRESA_CRIA', 'EMPRESA_ADAPTA'].includes(i.responsabilidade_arte) &&
          ['AGUARDANDO_INICIO', 'EM_CRIACAO', 'REVISAO_SOLICITADA', 'AGUARDANDO_CLIENTE'].includes(
            i.status_arte,
          ),
      ) ||
      itens.find((i) =>
        ['EMPRESA_CRIA', 'EMPRESA_ADAPTA'].includes(i.responsabilidade_arte),
      );

    if (pendente) {
      return urlArteWorkspace(osId, pendente.item_id);
    }
  } catch {
    // fallback
  }

  return '/arte';
}
