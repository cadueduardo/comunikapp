async function adminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/gestao${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const body = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
  };
  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(' ')
      : body.message || body.error || 'Não foi possível concluir a operação.';
    throw new Error(message);
  }
  return body as T;
}

export const adminApi = {
  login: (data: {
    email: string;
    password: string;
    twoFactorCode?: string;
  }) =>
    adminRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: <T>() => adminRequest<T>('/auth/me'),

  logout: () =>
    adminRequest('/auth/logout', {
      method: 'POST',
    }),

  validateInvitation: <T>(token: string) =>
    adminRequest<T>(
      `/auth/invitation?token=${encodeURIComponent(token)}`,
    ),

  acceptInvitation: <T>(data: {
    token: string;
    password: string;
  }) =>
    adminRequest<T>('/auth/invitation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirmTwoFactor: <T>(data: {
    setupToken: string;
    code: string;
  }) =>
    adminRequest<T>('/auth/2fa/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listStores: <T>(query: URLSearchParams) =>
    adminRequest<T>(`/stores?${query.toString()}`),

  getDashboardSummary: <T>(days: number) =>
    adminRequest<T>(`/dashboard/summary?days=${encodeURIComponent(String(days))}`),

  listAudit: <T>(query: URLSearchParams) =>
    adminRequest<T>(`/audit?${query.toString()}`),

  getStore: <T>(id: string) =>
    adminRequest<T>(`/stores/${encodeURIComponent(id)}`),

  getStoreTimeline: <T>(id: string, limit = 50) =>
    adminRequest<T>(
      `/stores/${encodeURIComponent(id)}/timeline?limit=${encodeURIComponent(String(limit))}`,
    ),

  updateStoreStatus: <T>(
    id: string,
    data: {
      status: string;
      category: string;
      reason: string;
    },
  ) =>
    adminRequest<T>(`/stores/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listStoreUsers: <T>(storeId: string) =>
    adminRequest<T>(
      `/stores/${encodeURIComponent(storeId)}/users`,
    ),

  listStoreUserInvitations: <T>(storeId: string) =>
    adminRequest<T>(
      `/stores/${encodeURIComponent(storeId)}/user-invitations`,
    ),

  createStoreUserInvitation: <T>(
    storeId: string,
    data: {
      nome: string;
      email: string;
      funcao: string;
      telefone?: string;
      mensagem?: string;
      exceptionReason?: string;
    },
  ) =>
    adminRequest<T>(
      `/stores/${encodeURIComponent(storeId)}/user-invitations`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  resendStoreUserInvitation: <T>(storeId: string, invitationId: string) =>
    adminRequest<T>(
      `/stores/${encodeURIComponent(storeId)}/user-invitations/${encodeURIComponent(invitationId)}/resend`,
      { method: 'POST' },
    ),

  cancelStoreUserInvitation: <T>(storeId: string, invitationId: string) =>
    adminRequest<T>(
      `/stores/${encodeURIComponent(storeId)}/user-invitations/${encodeURIComponent(invitationId)}`,
      { method: 'DELETE' },
    ),

  listInvitations: <T>() =>
    adminRequest<T>('/administrator-invitations'),

  listAdministrators: <T>(query = new URLSearchParams()) =>
    adminRequest<T>(`/administrators?${query.toString()}`),

  updateAdministrator: <T>(
    id: string,
    data: {
      role?: string;
      status?: string;
      currentPassword?: string;
      reason: string;
    },
  ) =>
    adminRequest<T>(`/administrators/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createInvitation: <T>(data: {
    nome: string;
    email: string;
    role: string;
    mensagem?: string;
  }) =>
    adminRequest<T>('/administrator-invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendInvitation: <T>(id: string) =>
    adminRequest<T>(
      `/administrator-invitations/${encodeURIComponent(id)}/resend`,
      { method: 'POST' },
    ),

  cancelInvitation: <T>(id: string) =>
    adminRequest<T>(
      `/administrator-invitations/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    ),

  listProductUpdates: <T>(query = new URLSearchParams()) =>
    adminRequest<T>(`/product-updates?${query.toString()}`),

  createProductUpdate: <T>(data: import('./admin-types').ProductUpdateInput) =>
    adminRequest<T>('/product-updates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProductUpdate: <T>(
    id: string,
    data: import('./admin-types').ProductUpdateInput,
  ) =>
    adminRequest<T>(`/product-updates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  requestProductUpdateReview: <T>(id: string) =>
    adminRequest<T>(
      `/product-updates/${encodeURIComponent(id)}/request-review`,
      { method: 'POST' },
    ),

  publishProductUpdate: <T>(id: string) =>
    adminRequest<T>(
      `/product-updates/${encodeURIComponent(id)}/publish`,
      { method: 'POST' },
    ),
};
