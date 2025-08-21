import { buildApiUrl, getAuthHeaders } from './config';

// Cliente HTTP centralizado para todas as chamadas de API
export class ApiClient {
  // GET request
  static async get<T>(endpoint: string, token?: string): Promise<T> {
    const url = buildApiUrl(endpoint);
    const headers = getAuthHeaders(token);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`HTTP error! status: ${response.status} - Unauthorized`);
        } else if (response.status === 403) {
          throw new Error(`HTTP error! status: ${response.status} - Forbidden`);
        } else if (response.status === 404) {
          throw new Error(`HTTP error! status: ${response.status} - Not Found`);
        } else if (response.status >= 500) {
          throw new Error(`HTTP error! status: ${response.status} - Server Error`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conectividade: Não foi possível conectar com o servidor. Verifique se o backend está rodando.');
      }
      throw error;
    }
  }
  
  // POST request
  static async post<T>(endpoint: string, data: Record<string, unknown>, token?: string): Promise<T> {
    const url = buildApiUrl(endpoint);
    const headers = getAuthHeaders(token);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  // PUT request
  static async put<T>(endpoint: string, data: Record<string, unknown>, token?: string): Promise<T> {
    const url = buildApiUrl(endpoint);
    const headers = getAuthHeaders(token);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  // DELETE request
  static async delete<T>(endpoint: string, token?: string): Promise<T> {
    const url = buildApiUrl(endpoint);
    const headers = getAuthHeaders(token);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  // PATCH request
  static async patch<T>(endpoint: string, data: Record<string, unknown>, token?: string): Promise<T> {
    const url = buildApiUrl(endpoint);
    const headers = getAuthHeaders(token);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

// Funções helper específicas para cada módulo
export const categoriasApi = {
  getAll: (token: string) => ApiClient.get('/categorias', token),
  getById: (id: string, token: string) => ApiClient.get(`/categorias/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/categorias', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/categorias/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/categorias/${id}`, token),
};

export const fornecedoresApi = {
  getAll: (token: string) => ApiClient.get('/fornecedores', token),
  getById: (id: string, token: string) => ApiClient.get(`/fornecedores/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/fornecedores', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/fornecedores/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/fornecedores/${id}`, token),
};

export const notificacoesApi = {
  getAll: (token: string, limit?: number) => ApiClient.get(`/notificacoes?limit=${limit || 10}`, token),
  getUnreadCount: (token: string) => ApiClient.get('/notificacoes/nao-visualizadas/count', token),
  markAsRead: (id: string, token: string) => ApiClient.patch(`/notificacoes/${id}/visualizar`, {}, token),
  delete: (id: string, token: string) => ApiClient.delete(`/notificacoes/${id}/deletar`, token),
};

export const lojasApi = {
  login: (data: Record<string, unknown>) => ApiClient.post('/lojas/login', data),
  register: (data: Record<string, unknown>) => ApiClient.post('/lojas', data),
  verifyEmail: (data: Record<string, unknown>) => ApiClient.post('/lojas/verificar-email', data),
  getCurrentUser: (token: string) => ApiClient.get('/lojas/me', token),
};

export const insumosApi = {
  getAll: (token: string) => ApiClient.get('/insumos', token),
  getById: (id: string, token: string) => ApiClient.get(`/insumos/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/insumos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/insumos/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/insumos/${id}`, token),
};

export const estoqueApi = {
  getItens: (token: string) => ApiClient.get('/api/estoque/itens', token),
  getItemById: (id: string, token: string) => ApiClient.get(`/api/estoque/itens/${id}`, token),
  getLocalizacoes: (token: string) => ApiClient.get('/api/estoque/localizacoes', token),
  getLocalizacaoById: (id: string, token: string) => ApiClient.get(`/api/estoque/localizacoes/${id}`, token),
  getMovimentacoes: (token: string) => ApiClient.get('/api/estoque/movimentacoes', token),
  getLotes: (token: string) => ApiClient.get('/api/estoque/lotes', token),
  getLoteById: (id: string, token: string) => ApiClient.get(`/api/estoque/lotes/${id}`, token),
  getTransferencias: (token: string) => ApiClient.get('/api/estoque/transferencias', token),
  createItem: (data: Record<string, unknown>, token: string) => ApiClient.post('/api/estoque/itens', data, token),
  updateItem: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/api/estoque/itens/${id}`, data, token),
  deleteItem: (id: string, token: string) => ApiClient.delete(`/api/estoque/itens/${id}`, token),
  createLocalizacao: (data: Record<string, unknown>, token: string) => ApiClient.post('/api/estoque/localizacoes', data, token),
  updateLocalizacao: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/api/estoque/localizacoes/${id}`, data, token),
  deleteLocalizacao: (id: string, token: string) => ApiClient.delete(`/api/estoque/localizacoes/${id}`, token),
  createMovimentacao: (data: Record<string, unknown>, token: string) => ApiClient.post('/api/estoque/movimentacoes', data, token),
  createLote: (data: Record<string, unknown>, token: string) => ApiClient.post('/api/estoque/lotes', data, token),
  updateLote: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/api/estoque/lotes/${id}`, data, token),
  deleteLote: (id: string, token: string) => ApiClient.delete(`/api/estoque/lotes/${id}`, token),
  createTransferencia: (data: Record<string, unknown>, token: string) => ApiClient.post('/api/estoque/transferencias', data, token),
};

export const produtosApi = {
  getAll: (token: string) => ApiClient.get('/produtos', token),
  getById: (id: string, token: string) => ApiClient.get(`/produtos/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/produtos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/produtos/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/produtos/${id}`, token),
};

export const orcamentosApi = {
  getAll: (token: string) => ApiClient.get('/orcamentos', token),
  getById: (id: string, token: string) => ApiClient.get(`/orcamentos/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/orcamentos/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/orcamentos/${id}`, token),
  calcular: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos/calcular', data, token),
  enviar: (id: string, token: string) => ApiClient.post(`/orcamentos/${id}/enviar`, {}, token),
  aprovar: (codigo: string, token: string) => ApiClient.post('/orcamentos/aprovar', { codigo }, token),
  reenviarCodigo: (id: string, token: string) => ApiClient.post(`/orcamentos/${id}/reenviar-codigo`, {}, token),
  getMensagens: (id: string, token: string) => ApiClient.get(`/orcamentos/${id}/mensagens`, token),
  getMensagensNaoVisualizadas: (id: string, token: string) => ApiClient.get(`/orcamentos/${id}/mensagens/nao-visualizadas`, token),
  marcarMensagemVisualizada: (orcamentoId: string, mensagemId: string, token: string) => 
    ApiClient.patch(`/orcamentos/${orcamentoId}/mensagens/${mensagemId}/visualizar`, {}, token),
  processarAcaoCliente: (id: string, acao: string, data: Record<string, unknown>, token: string) => 
    ApiClient.post(`/orcamentos/${id}/acao-cliente`, { acao, ...data }, token),
  getVersoes: (id: string, token: string) => ApiClient.get(`/orcamentos/${id}/versoes`, token),
  getPublico: (id: string) => ApiClient.get(`/orcamentos/${id}/publico`),
  salvarRascunho: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos/rascunho', data, token),
  recalcularExistentes: (token: string) => ApiClient.post('/orcamentos/recalcular-existentes', {}, token),
};

export const clientesApi = {
  getAll: (token: string) => ApiClient.get('/clientes', token),
  getById: (id: string, token: string) => ApiClient.get(`/clientes/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/clientes', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/clientes/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/clientes/${id}`, token),
  search: (query: string, token: string) => ApiClient.get(`/clientes/search?q=${encodeURIComponent(query)}`, token),
};

export const maquinasApi = {
  getAll: (token: string) => ApiClient.get('/maquinas', token),
  getById: (id: string, token: string) => ApiClient.get(`/maquinas/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/maquinas', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/maquinas/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/maquinas/${id}`, token),
};

export const funcoesApi = {
  getAll: (token: string) => ApiClient.get('/funcoes', token),
  getById: (id: string, token: string) => ApiClient.get(`/funcoes/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/funcoes', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/funcoes/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/funcoes/${id}`, token),
};

export const custosIndiretosApi = {
  getAll: (token: string) => ApiClient.get('/custos-indiretos', token),
  getById: (id: string, token: string) => ApiClient.get(`/custos-indiretos/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/custos-indiretos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/custos-indiretos/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/custos-indiretos/${id}`, token),
};

export const tiposMaterialApi = {
  getAll: (token: string) => ApiClient.get('/tipos-material', token),
  getById: (id: string, token: string) => ApiClient.get(`/tipos-material/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/tipos-material', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/tipos-material/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/tipos-material/${id}`, token),
};

export const usuariosApi = {
  getAll: (token: string) => ApiClient.get('/usuarios', token),
  getById: (id: string, token: string) => ApiClient.get(`/usuarios/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/usuarios', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/usuarios/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/usuarios/${id}`, token),
};
