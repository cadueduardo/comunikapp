import { joinApiBaseAndEndpoint } from '@/lib/config';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
const SESSION_EXPIRED_IGNORED_ENDPOINTS = new Set([
  '/lojas/login',
  '/lojas/login/2fa',
  '/lojas/verificar-email',
  '/lojas/reenviar-verificacao',
  '/lojas',
  '/usuarios/reenviar-codigo',
  '/usuarios/definir-senha',
  '/usuarios/solicitar-redefinicao-senha',
  '/usuarios/redefinir-senha',
  '/api/auth/login',
  '/api/auth/login/2fa',
  '/api/auth/logout',
  '/api/auth/me',
]);

export class AuthApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
  }
}

/**
 * Sessão vive no cookie HttpOnly. Não ler JWT do localStorage.
 * Mantido só por compatibilidade de assinatura em hotspots legados.
 */
const getAuthToken = (): string | null => null;

// Headers de tenant/roles a partir do localStorage (preenchidos pelo UserContext)
const getTenantHeaders = () => {
  if (typeof window === 'undefined') return {} as Record<string, string>;
  const lojaId = localStorage.getItem('loja_id');
  const roles = localStorage.getItem('user_roles');
  const headers: Record<string, string> = {};
  if (lojaId) headers['x-loja-id'] = lojaId;
  if (roles) headers['x-user-roles'] = roles;

  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.comunikapp\.com\.br$/);
  if (match && match[1] !== 'www' && match[1] !== 'api') {
    headers['x-tenant-slug'] = match[1];
  }
  return headers;
};

// Função para fazer requisições com autenticação automática (cookie + credentials)
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = getAuthToken();
  const isEstoqueEndpoint = endpoint.startsWith('/api/estoque/');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (isEstoqueEndpoint) {
    Object.assign(headers, getTenantHeaders());
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(joinApiBaseAndEndpoint(API_BASE_URL, endpoint), {
      ...options,
      headers,
      credentials: 'include',
    });

    const shouldTriggerSessionExpired =
      response.status === 401 &&
      !SESSION_EXPIRED_IGNORED_ENDPOINTS.has(endpoint);

    if (shouldTriggerSessionExpired) {
      if (typeof window !== 'undefined') {
        try {
          const event = new CustomEvent('session-expired', {
            detail: {
              endpoint,
              status: response.status,
            },
          });
          window.dispatchEvent(event);
        } catch (e) {
          console.warn('Falha ao disparar evento de sessão expirada:', e);
        }
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Erro na requisição API:', error);

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Não foi possível conectar ao servidor. Verifique a conectividade com a API.',
      );
    }

    if (error instanceof TypeError && error.message.includes('CORS')) {
      throw new Error(
        'Erro de CORS. Verifique se o backend está configurado corretamente.',
      );
    }

    if (error instanceof TypeError && error.message.includes('timeout')) {
      throw new Error(
        'Timeout na requisição. O servidor pode estar sobrecarregado.',
      );
    }

    throw error;
  }
};

export const authAPI = {
  login: async (email: string, password: string, captchaToken?: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, captchaToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthApiError(
        errorData.message || 'Erro ao fazer login',
        errorData.code,
      );
    }

    return response.json();
  },

  verifyTwoFactorLogin: async (temporaryToken: string, code: string) => {
    const response = await fetch('/api/auth/login/2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ temporaryToken, code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthApiError(
        errorData.message || 'Codigo 2FA invalido',
        errorData.code,
      );
    }

    return response.json();
  },

  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthApiError(errorData.message || 'Erro ao sair', errorData.code);
    }
    return response.json().catch(() => ({ ok: true }));
  },

  solicitarRedefinicaoSenha: async (email: string) => {
    const response = await apiRequest('/usuarios/solicitar-redefinicao-senha', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthApiError(
        errorData.message || 'Erro ao solicitar redefinicao de senha',
        errorData.code,
      );
    }

    return response.json();
  },

  redefinirSenha: async (token: string, senha: string) => {
    const response = await apiRequest('/usuarios/redefinir-senha', {
      method: 'POST',
      body: JSON.stringify({ token, senha }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AuthApiError(
        errorData.message || 'Erro ao redefinir senha',
        errorData.code,
      );
    }

    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados do usuário');
    }

    return response.json();
  },
};

// Função para uso em API Routes (server-side)
export const apiRequestServer = async (
  endpoint: string,
  options: RequestInit = {},
  request?: Request,
): Promise<any> => {
  let token: string | null = null;
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((c) => c.trim());
        const tokenCookie = cookies.find(
          (c) =>
            c.startsWith('comunikapp_session=') || c.startsWith('access_token='),
        );
        if (tokenCookie) {
          token = decodeURIComponent(tokenCookie.split('=').slice(1).join('='));
        }
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(joinApiBaseAndEndpoint(API_BASE_URL, endpoint), {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Erro na requisição: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro na requisição API (server):', error);
    throw error;
  }
};

export default apiRequest;
