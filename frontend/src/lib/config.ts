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

// Função helper para construir URLs completas
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
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
