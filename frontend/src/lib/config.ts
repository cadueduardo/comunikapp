import { ENV_CONFIG } from './env';

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
  }
};

// Função helper para construir URLs da API.
//
// Comportamento por ambiente:
// - No browser (client-side): retorna URL relativa baseada em ENV_CONFIG.API_URL
//   (default "/api"), preservando o atalho do rewrite definido em next.config.mjs.
// - Em route handlers do Next.js (server-side, sem `window`): o fetch exige URL
//   absoluta. Aqui caímos em process.env.BACKEND_URL (que o next.config.mjs já
//   injeta a partir de BACKEND_URL/127.0.0.1:4000), evitando o erro genérico
//   `TypeError: Failed to parse URL from /api/...` que aparecia como 500 opaco
//   no log do Next sempre que uma rota chamava `buildApiUrl('/algo')`.
//
// Trade-off conhecido: ENV_CONFIG.API_URL pode estar configurada como caminho
// absoluto em produção (ex.: "https://api.comunikapp.com.br"). Nesse caso ela
// já é absoluta e funciona dos dois lados — então o ramo server-side só
// substitui o fallback "/api" do dev local.
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseUrl;
  const isRelative = baseUrl.startsWith('/');
  const isServer = typeof window === 'undefined';

  if (isServer && isRelative) {
    const backendUrl =
      process.env.BACKEND_URL || 'http://localhost:4000';
    return `${backendUrl}${endpoint}`;
  }

  return `${baseUrl}${endpoint}`;
};

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
  return buildApiUrl(path.startsWith('/') ? path : `/${path}`);
};

// Função helper para obter headers com autenticação
export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    ...API_CONFIG.defaultHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
