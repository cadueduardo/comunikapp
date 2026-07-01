export async function conferirPreflightArteCliente(
  versaoId: string,
  observacao?: string,
): Promise<void> {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  const response = await fetch(
    `/api/arte-aprovacao/versoes/${versaoId}/conferir-preflight`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ observacao: observacao?.trim() || undefined }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erro ao conferir arte e liberar para produção');
  }
}
