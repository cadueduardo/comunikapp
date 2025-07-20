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
  
  console.log('API Request:', {
    endpoint: `${API_BASE_URL}${endpoint}`,
    hasToken: !!token,
    method: options.method || 'GET'
  });
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log('Fazendo requisição para:', `${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log('Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Se receber 401, limpar o token e redirecionar para login
    if (response.status === 401) {
      console.log('Token inválido, redirecionando para login');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    console.error('Erro na requisição API:', error);
    
    // Verificar se é um erro de rede
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando em http://localhost:3001');
    }
    
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