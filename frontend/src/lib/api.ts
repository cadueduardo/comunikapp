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
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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