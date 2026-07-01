export async function registrarLinkArteCliente(
  osId: string,
  itemId: string,
  payload: { url: string; descricao?: string },
) {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const response = await fetch(
    `/api/arte-aprovacao/os/${osId}/itens/${itemId}/registrar-link`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.message || data.error || 'Não foi possível registrar o link',
    );
  }
  return data;
}

export async function solicitarArteAoCliente(
  osId: string,
  itemId: string,
  payload?: { mensagem?: string },
) {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('Sessão expirada. Faça login novamente.');

  const response = await fetch(
    `/api/arte-aprovacao/os/${osId}/itens/${itemId}/solicitar-arte`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload ?? {}),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      data.message || data.error || 'Não foi possível enviar o e-mail',
    );
  }
  return data as {
    success: boolean;
    data: {
      enviado_para: string;
      produto: string;
      preview_url?: string;
    };
  };
}
