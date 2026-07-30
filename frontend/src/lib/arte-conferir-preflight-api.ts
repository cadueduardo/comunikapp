import {
  buildClientAuthHeaders,
  hasClientSession,
} from '@/lib/session-auth';

export async function conferirPreflightArteCliente(
  versaoId: string,
  observacao?: string,
): Promise<void> {
  if (!hasClientSession()) {
    throw new Error('Sessão não encontrada. Faça login novamente.');
  }

  const response = await fetch(
    `/api/arte-aprovacao/versoes/${versaoId}/conferir-preflight`,
    {
      method: 'POST',
      headers: buildClientAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ observacao: observacao?.trim() || undefined }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 'Erro ao conferir arte e liberar para produção',
    );
  }
}
