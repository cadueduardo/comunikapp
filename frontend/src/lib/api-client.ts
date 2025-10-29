import { buildApiUrl, getAuthHeaders } from './config';

async function buildErrorMessage(response: Response): Promise<string> {
  const baseMessage = `HTTP error! status: ${response.status}`;

  try {
    const data = await response.clone().json();

    if (!data) {
      return baseMessage;
    }

    if (typeof data === 'string') {
      return `${baseMessage} - ${data}`;
    }

    const message = data.message || data.error || data.title;

    if (!message) {
      return baseMessage;
    }

    if (Array.isArray(message)) {
      return `${baseMessage} - ${message.join(' | ')}`;
    }

    return `${baseMessage} - ${message}`;
  } catch (error) {
    return baseMessage;
  }
}

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
        cache: 'default', // Mudado de 'no-store' para 'default' para permitir cache
      });
      
      if (!response.ok) {
        throw new Error(await buildErrorMessage(response));
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
  static async post<T>(endpoint: string, data: Record<string, unknown> | FormData, token?: string): Promise<T> {
    const url = buildApiUrl(endpoint);
    const headers = getAuthHeaders(token);
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const requestHeaders = isFormData ? { ...headers } : headers;
    if (isFormData) {
      delete requestHeaders['Content-Type'];
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: isFormData ? data : JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(await buildErrorMessage(response));
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
      throw new Error(await buildErrorMessage(response));
    }
    
    return response.json();
  }
  
  // DELETE request
  static async delete<T>(endpoint: string, token?: string, data?: Record<string, unknown>): Promise<T> {
    const url = buildApiUrl(endpoint);
    const headers = getAuthHeaders(token);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...headers,
        ...(data && { 'Content-Type': 'application/json' }),
      },
      ...(data && { body: JSON.stringify(data) }),
    });
    
    if (!response.ok) {
      throw new Error(await buildErrorMessage(response));
    }
    
    // Se status 204 (No Content), retorna undefined
    if (response.status === 204) {
      return undefined as T;
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
      throw new Error(await buildErrorMessage(response));
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
  getAll: (token: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return ApiClient.get(`/orcamentos-v2/notificacoes?${params.toString()}`, token);
  },
  getUnreadCount: (token: string) => ApiClient.get('/orcamentos-v2/notificacoes/nao-visualizadas/count', token),
  markAsRead: (id: string, token: string) => ApiClient.patch(`/orcamentos-v2/notificacoes/${id}/visualizar`, {}, token),
  markAllAsRead: (token: string) => ApiClient.patch('/orcamentos-v2/notificacoes/visualizar-todas', {}, token),
  delete: (id: string, token: string) => ApiClient.delete(`/orcamentos-v2/notificacoes/${id}`, token),
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
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/insumos/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/insumos/${id}`, token),
  importar: (file: File, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return ApiClient.post('/insumos/importar', formData, token);
  },
  downloadTemplate: async (token: string) => {
    const url = buildApiUrl('/insumos/template');
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'template-importacao-insumos.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
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
  getAll: (token: string) => ApiClient.get('/orcamentos-v2', token),
  getById: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos-v2', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/orcamentos-v2/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/orcamentos-v2/${id}`, token),
  calcular: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos-v2/calcular', data, token),
  enviar: (id: string, token: string) => ApiClient.post(`/orcamentos-v2/${id}/enviar`, {}, token),
  aprovar: (codigo: string, token: string) => ApiClient.post('/orcamentos-v2/aprovar', { codigo }, token),
  reenviarCodigo: (id: string, token: string) => ApiClient.post(`/orcamentos-v2/${id}/reenviar-codigo`, {}, token),
  getMensagens: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}/mensagens`, token),
  getMensagensNaoVisualizadas: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}/mensagens/nao-visualizadas`, token),
  marcarMensagemVisualizada: (orcamentoId: string, mensagemId: string, token: string) => 
    ApiClient.patch(`/orcamentos-v2/${orcamentoId}/mensagens/${mensagemId}/visualizar`, {}, token),
  processarAcaoCliente: (id: string, acao: string, data: Record<string, unknown>, token: string) => 
    ApiClient.post(`/orcamentos-v2/${id}/acao-cliente`, { acao, ...data }, token),
  getVersoes: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}/versoes`, token),
  getPublico: (id: string) => ApiClient.get(`/orcamentos-v2/${id}/publico`),
  salvarRascunho: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos-v2/rascunho', data, token),
  recalcularExistentes: (token: string) => ApiClient.post('/orcamentos-v2/recalcular-existentes', {}, token),
  
  // APIs V2 - Sistema Multi-Produtos
  v2: {
    getAll: (token: string) => ApiClient.get('/orcamentos-v2', token),
    getById: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}`, token),
    create: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos-v2', data, token),
    update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/orcamentos-v2/${id}`, data, token),
    delete: (id: string, token: string, data?: { motivo?: string }) => ApiClient.delete(`/orcamentos-v2/${id}`, token, data),
    
    // Cálculo via Motor V2
    calcularOrcamento: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos-v2/calcular', data, token),
    calcularPreview: (data: Record<string, unknown>, token: string) => ApiClient.post('/motor-calculo-v2/preview', data, token),
    validarDados: (data: Record<string, unknown>, token: string) => ApiClient.post('/motor-calculo-v2/validar', data, token),
    
    // Operações específicas V2
    enviarParaAprovacao: (id: string, observacoes: string, token: string) => 
      ApiClient.post(`/orcamentos-v2/${id}/enviar-aprovacao`, { observacoes }, token),
    aprovar: (id: string, observacoes: string, token: string) => 
      ApiClient.post(`/orcamentos-v2/${id}/aprovar`, { observacoes }, token),
    rejeitar: (id: string, motivo: string, token: string) => 
      ApiClient.post(`/orcamentos-v2/${id}/rejeitar`, { motivo }, token),
    
    // Chat e mensagens V2
    getMensagens: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}/chat/mensagens`, token),
    enviarMensagem: (id: string, mensagem: string, token: string) => 
      ApiClient.post(`/orcamentos-v2/${id}/chat/mensagens`, { mensagem }, token),
    
    // Links públicos V2
    criarLinkPublico: (id: string, configuracoes: Record<string, unknown>, token: string) => 
      ApiClient.post(`/orcamentos-v2/${id}/links`, configuracoes, token),
    getLinkPublico: (token: string) => ApiClient.get(`/orcamentos-v2/links/${token}`),
    
    // Versões e histórico V2
    getVersoes: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}/versoes`, token),
    criarVersao: (id: string, descricao: string, token: string) => 
      ApiClient.post(`/orcamentos-v2/${id}/versoes`, { descricao }, token),
    
    // Validação de estoque V2
    validarEstoque: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}/validar-estoque`, token),
    
    // Estatísticas V2
    getEstatisticas: (token: string) => ApiClient.get('/motor-calculo-v2/estatisticas', token),
    healthCheck: () => ApiClient.get('/motor-calculo-v2/health'),
  },
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
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/maquinas/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/maquinas/${id}`, token),
};

export const funcoesApi = {
  getAll: (token: string) => ApiClient.get('/funcoes', token),
  getById: (id: string, token: string) => ApiClient.get(`/funcoes/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/funcoes', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/funcoes/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/funcoes/${id}`, token),
};

export const custosIndiretosApi = {
  getAll: (token: string) => ApiClient.get('/custos-indiretos', token),
  getById: (id: string, token: string) => ApiClient.get(`/custos-indiretos/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/custos-indiretos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/custos-indiretos/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/custos-indiretos/${id}`, token),
};

export const servicosManuaisApi = {
  getAll: (token: string) => ApiClient.get('/servicos-manuais', token),
  getById: (id: string, token: string) => ApiClient.get(`/servicos-manuais/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/servicos-manuais', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/servicos-manuais/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/servicos-manuais/${id}`, token),
};

export const tiposMaterialApi = {
  getAll: (token: string) => ApiClient.get('/tipos-material', token),
  getById: (id: string, token: string) => ApiClient.get(`/tipos-material/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/tipos-material', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/tipos-material/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/tipos-material/${id}`, token),
};

export const usuariosApi = {
  getAll: (token: string) => ApiClient.get('/usuarios', token),
  getById: (id: string, token: string) => ApiClient.get(`/usuarios/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/usuarios', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/usuarios/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/usuarios/${id}`, token),
};
