const API_BASE_URL = 'http://localhost:3001';

// Função para obter o token do localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

// Função para fazer requisições com autenticação automática
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Se receber 401, limpar o token e redirecionar para login
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Erro na requisição API:', error);
    
    // Verificar se é um erro de rede
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3001');
    }
    
    // Verificar se é um erro de CORS
    if (error instanceof TypeError && error.message.includes('CORS')) {
      throw new Error('Erro de CORS. Verifique se o backend está configurado corretamente.');
    }
    
    // Verificar se é um erro de timeout
    if (error instanceof TypeError && error.message.includes('timeout')) {
      throw new Error('Timeout na requisição. O servidor pode estar sobrecarregado.');
    }
    
    // Outros erros
    throw error;
  }
};

// Funções específicas para diferentes endpoints
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/lojas/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao fazer login');
    }
    
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await apiRequest('/lojas/me');
    
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do usuário');
    }
    
    return response.json();
  },
};

export default apiRequest; 