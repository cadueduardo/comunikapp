import { ENV_CONFIG } from './env';
import { isCustomTenantHost } from './tenant-host';

// Configuração centralizada da API
export const API_CONFIG = {
  // URL base da API - pode ser configurada por variável de ambiente
  baseUrl: ENV_CONFIG.API_URL,

  // Timeout padrão para requisições (em ms)
  timeout: 10000,

  // Headers padrão
  defaultHeaders: {
    'Content-Type': 'application/json',
  },

  // Endpoints específicos (se necessário)
  endpoints: {
    auth: '/lojas',
    categorias: '/categorias',
    fornecedores: '/fornecedores',
    notificacoes: '/notificacoes',
    insumos: '/insumos',
    estoque: '/estoque',
    clientes: '/clientes',
    produtos: '/produtos',
    orcamentos: '/orcamentos',
    usuarios: '/usuarios',
  },
};

// Função helper para construir URLs da API.
//
// Comportamento por ambiente:
// - No browser (client-side): retorna URL relativa baseada em ENV_CONFIG.API_URL
//   (default "/api"), preservando o atalho do rewrite definido em next.config.mjs.
// - Em domínio próprio (Fatia D): força "/api" (same-origin via Nginx no host custom).
// - Em route handlers do Next.js (server-side, sem `window`): o fetch exige URL
//   absoluta via BACKEND_URL.
/**
 * Junta base + endpoint sem duplicar o prefixo `/api`
 * (ex.: base `/api` + `/api/estoque/...` → `/api/estoque/...`).
 */
export const joinApiBaseAndEndpoint = (
  baseUrl: string,
  endpoint: string,
): string => {
  const base = baseUrl.replace(/\/$/, '');
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if ((base === '/api' || base.endsWith('/api')) && ep.startsWith('/api/')) {
    if (base === '/api') return ep;
    return `${base.slice(0, -4)}${ep}`;
  }

  return `${base}${ep}`;
};

export const buildApiUrl = (endpoint: string): string => {
  const isServer = typeof window === 'undefined';

  // Browser: sempre BFF same-origin. Cookie HttpOnly não vai para api.*.
  if (!isServer) {
    return joinApiBaseAndEndpoint('/api', endpoint);
  }

  const baseUrl = API_CONFIG.baseUrl;
  const isRelative = baseUrl.startsWith('/');

  if (isRelative) {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    return joinApiBaseAndEndpoint(backendUrl, endpoint);
  }

  return joinApiBaseAndEndpoint(baseUrl, endpoint);
};

/** Base URL do Socket.IO no browser (same-origin em domínio custom). */
export function getClientSocketBaseUrl(): string {
  if (
    typeof window !== 'undefined' &&
    isCustomTenantHost(window.location.host)
  ) {
    return window.location.origin;
  }
  const configuredUrl = (
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ''
  ).replace(/\/$/, '');

  if (!configuredUrl || configuredUrl === '/api') {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          return `${window.location.protocol}//${host}:4000`;
        }
      }
      return 'http://localhost:4000';
    }
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  if (configuredUrl.endsWith('/api')) {
    return configuredUrl.slice(0, -4);
  }

  return configuredUrl;
}

/** Resolve caminhos de upload/logo da loja para exibicao no frontend. */
export const resolveAssetUrl = (path?: string | null): string | null => {
  if (!path || path.includes('undefined')) return null;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const resolved = buildApiUrl(path.startsWith('/') ? path : `/${path}`);
  // Query distinta evita HIT de 404/403 antigo na Cloudflare (mesmo path).
  if (resolved.includes('/uploads/') && !/[?&]v=/.test(resolved)) {
    return `${resolved}?v=20260901`;
  }
  return resolved;
};

// Função helper para obter headers com autenticação.
// Sem token JWT explícito, a sessão vai no cookie HttpOnly (credentials: 'include').
export const getAuthHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    ...API_CONFIG.defaultHeaders,
  };

  if (
    token &&
    token !== 'null' &&
    token !== 'undefined' &&
    token !== 'cookie-session'
  ) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};
