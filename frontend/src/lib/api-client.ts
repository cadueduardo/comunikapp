import { buildApiUrl, getAuthHeaders } from './config';

async function buildErrorMessage(response: Response): Promise<string> {
  const baseMessage = `HTTP error! status: ${response.status}`;

  try {
    const data = await response.clone().json();

    if (!data) {
      return baseMessage;
    }

    const message = data.message || data.error || data.title;

    if (!message) {
      return baseMessage;
    }

    const text = Array.isArray(message) ? message.join(' | ') : String(message);
    // Em erros 4xx, priorizar a mensagem da API (ex.: validação) em vez do prefixo técnico
    if (response.status >= 400 && response.status < 500 && text) {
      return text;
    }
    return `${baseMessage} - ${text}`;
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
        // Em orçamentos a consistência do dado exibido é crítica (preview/lista).
        // Evita retornar valores antigos após salvar/atualizar.
        cache: 'no-store',
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
  static async post<T>(endpoint: string, data: object | FormData, token?: string): Promise<T> {
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
  static async put<T>(endpoint: string, data: object, token?: string): Promise<T> {
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
  static async delete<T>(endpoint: string, token?: string, data?: object): Promise<T> {
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
  static async patch<T>(endpoint: string, data: object, token?: string): Promise<T> {
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

export type TipoFornecedorApi = 'INSUMO' | 'TERCEIRIZADO' | 'AMBOS';

export interface FornecedorApi {
  id: string;
  nome: string;
  razao_social?: string | null;
  cnpj_cpf?: string | null;
  tipo: TipoFornecedorApi;
  ativo: boolean;
  contato_nome?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  especialidades?: unknown;
  _count?: {
    insumos: number;
    insumos_associados?: number;
    itens_terceirizados: number;
    produtos_orcados_terceirizados?: number;
  };
}

export const fornecedoresApi = {
  getAll: (
    token: string,
    finalidade?: 'INSUMO' | 'TERCEIRIZACAO',
  ) =>
    ApiClient.get<FornecedorApi[]>(
      `/fornecedores${finalidade ? `?finalidade=${finalidade}` : ''}`,
      token,
    ),
  getById: (id: string, token: string) => ApiClient.get(`/fornecedores/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/fornecedores', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/fornecedores/${id}`, data, token),
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
  resendVerification: (data: Record<string, unknown>) =>
    ApiClient.post('/lojas/reenviar-verificacao', data),
  getCurrentUser: (token: string) => ApiClient.get('/lojas/me', token),
  getMinhaLoja: (token: string) => ApiClient.get('/lojas/minha-loja', token),
};

export const platformApi = {
  me: (token: string) => ApiClient.get('/platform/me', token),
  validateInvite: (inviteToken: string) =>
    ApiClient.get(`/platform/convites/validar?token=${encodeURIComponent(inviteToken)}`),
  registerBetaInterest: (data: Record<string, unknown>) =>
    ApiClient.post('/platform/interesse-beta', data),
  listInvites: (token: string) => ApiClient.get('/platform/convites', token),
  createInvite: (data: Record<string, unknown>, token: string) =>
    ApiClient.post('/platform/convites', data, token),
  revokeInvite: (id: string, token: string) =>
    ApiClient.post(`/platform/convites/${id}/revogar`, {}, token),
  submitBetaFeedback: (data: Record<string, unknown>, token: string) =>
    ApiClient.post('/platform/feedback-beta', data, token),
};

export const insumosApi = {
  getAll: (token: string) => ApiClient.get('/insumos', token),
  buscarPorNome: (
    token: string,
    q: string,
    options?: { limit?: number; excludeId?: string },
  ) => {
    const params = new URLSearchParams();
    params.set('q', q);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.excludeId) params.set('excludeId', options.excludeId);
    return ApiClient.get(`/insumos/busca?${params.toString()}`, token);
  },
  getById: (id: string, token: string) => ApiClient.get(`/insumos/${id}`, token),
  getOpcoesFornecedoresOrcamento: (
    id: string,
    token: string,
    fornecedorSelecionadoId?: string,
  ) =>
    ApiClient.get(
      `/insumos/${id}/fornecedores/opcoes-orcamento${
        fornecedorSelecionadoId
          ? `?selecionado=${encodeURIComponent(fornecedorSelecionadoId)}`
          : ''
      }`,
      token,
    ),
  duplicar: (id: string, token: string) => duplicarInsumo(id, token),
  getCalculoChapa: (id: string, token: string) => ApiClient.get(`/insumos/${id}/calculo-chapa`, token),
  simularChapa: (id: string, data: Record<string, unknown>, token: string) => ApiClient.post(`/insumos/${id}/simular-chapa`, data, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/insumos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/insumos/${id}`, data, token),
  vincularFornecedores: (
    id: string,
    data: {
      fornecedores: Array<{
        fornecedor_id: string;
        preco_custo: number;
        codigo_ref?: string;
        padrao: boolean;
      }>;
    },
    token: string,
  ) => ApiClient.patch(`/insumos/${id}/fornecedores`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/insumos/${id}`, token),
  reativar: (id: string, token: string) =>
    ApiClient.post(`/insumos/${id}/reativar`, {}, token),
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

export function duplicarInsumo(id: string, token: string) {
  return ApiClient.post<{ id?: string }>(`/insumos/${id}/duplicar`, {}, token);
}

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
  getSobras: (token: string) => ApiClient.get('/api/estoque/sobras', token),
  getSobraById: (id: string, token: string) => ApiClient.get(`/api/estoque/sobras/${id}`, token),
  createSobra: (data: Record<string, unknown>, token: string) => ApiClient.post('/api/estoque/sobras', data, token),
  aproveitarSobra: (id: string, data: Record<string, unknown>, token: string) => ApiClient.post(`/api/estoque/sobras/${id}/aproveitar`, data, token),
  descartarSobra: (id: string, data: Record<string, unknown>, token: string) => ApiClient.post(`/api/estoque/sobras/${id}/descartar`, data, token),
  buscarSugestoesSobras: (params: Record<string, string>, token: string) => {
    const search = new URLSearchParams(params).toString();
    return ApiClient.get(`/api/estoque/sobras/sugestoes/buscar${search ? `?${search}` : ''}`, token);
  },
  getMetricasEconomia: (token: string) =>
    ApiClient.get('/api/estoque/sobras/metricas/economia', token),
};

export const produtosApi = {
  getAll: (token: string) => ApiClient.get('/produtos', token),
  getById: (id: string, token: string) => ApiClient.get(`/produtos/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/produtos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/produtos/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/produtos/${id}`, token),
};

export const produtosFinitosApi = {
  getAll: (
    token: string,
    params?: {
      page?: number;
      limit?: number;
      categoria_id?: string;
      busca?: string;
      ativo?: boolean;
    },
  ) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.categoria_id) search.set('categoria_id', params.categoria_id);
    if (params?.busca) search.set('busca', params.busca);
    if (typeof params?.ativo === 'boolean') search.set('ativo', String(params.ativo));
    const qs = search.toString();
    return ApiClient.get(`/produtos-finitos${qs ? `?${qs}` : ''}`, token);
  },
  getById: (id: string, token: string) =>
    ApiClient.get(`/produtos-finitos/${id}`, token),
  getParaOrcamento: (id: string, token: string) =>
    ApiClient.get(`/produtos-finitos/${id}/para-orcamento`, token),
  create: (data: Record<string, unknown>, token: string) =>
    ApiClient.post('/produtos-finitos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) =>
    ApiClient.patch(`/produtos-finitos/${id}`, data, token),
  delete: (id: string, token: string) =>
    ApiClient.delete(`/produtos-finitos/${id}`, token),
  listarCategorias: (token: string, ativo?: boolean) =>
    ApiClient.get(
      `/produtos-finitos/categorias${
        typeof ativo === 'boolean' ? `?ativo=${ativo}` : ''
      }`,
      token,
    ),
  criarCategoria: (nome: string, token: string) =>
    ApiClient.post('/produtos-finitos/categorias', { nome }, token),
  uploadImagem: (id: string, file: File, token: string) => {
    const formData = new FormData();
    formData.append('arquivo', file);
    return ApiClient.post(`/produtos-finitos/${id}/imagens`, formData, token);
  },
  removerImagem: (produtoId: string, imagemId: string, token: string) =>
    ApiClient.delete(`/produtos-finitos/${produtoId}/imagens/${imagemId}`, token),
  reordenarImagens: (
    produtoId: string,
    imagemIds: string[],
    token: string,
  ) =>
    ApiClient.patch(
      `/produtos-finitos/${produtoId}/imagens/reordenar`,
      { imagem_ids: imagemIds },
      token,
    ),
};

export const orcamentosApi = {
  getAll: (token: string) => ApiClient.get('/orcamentos-v2', token),
  getById: (id: string, token: string) => ApiClient.get(`/orcamentos-v2/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos-v2', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/orcamentos-v2/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/orcamentos-v2/${id}`, token),
  calcular: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos-v2/calcular', data, token),
  enviar: (id: string, token: string) => ApiClient.post(`/orcamentos-v2/${id}/enviar`, {}, token),
  fecharPedido: (id: string, token: string, observacoes?: string) =>
    ApiClient.post(`/orcamentos-v2/${id}/fechar-pedido`, { observacoes }, token),
  aprovar: (codigo: string, token: string) => ApiClient.post('/orcamentos-v2/aprovar', { codigo }, token),
  reenviarCodigo: (id: string, token: string) => ApiClient.post(`/orcamentos-v2/${id}/reenviar-codigo`, {}, token),
  simularChapaItem: (id: string, itemId: string, data: Record<string, unknown>, token: string) => ApiClient.post(`/orcamentos-v2/${id}/itens/${itemId}/simular-chapa`, data, token),
  salvarCalculoChapaItem: (id: string, itemId: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/orcamentos-v2/${id}/itens/${itemId}/calculo-chapa`, data, token),
  buscarOrigemSobra: (q: string, token: string) =>
    ApiClient.get(
      `/orcamentos-v2/origem-sobra/busca${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      token,
    ),
  getCandidatosSobra: (orcamentoId: string, token: string) =>
    ApiClient.get(`/orcamentos-v2/${orcamentoId}/candidatos-sobra`, token),
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
    duplicar: (
      id: string,
      data: { titulo?: string; descricao?: string },
      token: string,
    ) => ApiClient.post(`/orcamentos-v2/${id}/duplicar`, data, token),

    // Cálculo via Motor V2
    calcularOrcamento: (data: Record<string, unknown>, token: string) => ApiClient.post('/orcamentos-v2/calcular', data, token),
    calcularPreview: (data: Record<string, unknown>, token: string) => ApiClient.post('/motor-calculo-v2/preview', data, token),
    validarDados: (data: Record<string, unknown>, token: string) => ApiClient.post('/motor-calculo-v2/validar', data, token),
    
    // Operações específicas V2
    enviarParaAprovacao: (id: string, observacoes: string, token: string) => 
      ApiClient.post(`/orcamentos-v2/${id}/enviar-aprovacao`, { observacoes }, token),
    fecharPedido: (id: string, token: string, observacoes?: string) =>
      ApiClient.post(`/orcamentos-v2/${id}/fechar-pedido`, { observacoes }, token),
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

export const osApi = {
  getMateriais: (id: string, token: string) =>
    ApiClient.get(`/os/${id}/materiais`, token),
  ignorarSobra: (id: string, itemId: string, token: string) =>
    ApiClient.post(`/os/${id}/itens/${itemId}/ignorar-sobra`, {}, token),
  anotarSobra: (id: string, itemId: string, data: Record<string, unknown>, token: string) =>
    ApiClient.post(`/os/${id}/itens/${itemId}/anotar-sobra`, data, token),
  registrarSobra: (id: string, itemId: string, data: Record<string, unknown>, token: string) =>
    ApiClient.post(`/os/${id}/itens/${itemId}/registrar-sobra`, data, token),
};

export const pcpApi = {
  getTerceirizacoes: (token: string, status?: string) =>
    ApiClient.get(
      `/pcp/terceirizacao${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      token,
    ),
  updateTerceirizacaoStatus: (
    id: string,
    status: string,
    token: string,
  ) => ApiClient.patch(`/pcp/terceirizacao/${id}/status`, { status }, token),
  getCapacidadeSetores: (token: string, params?: Record<string, string>) => {
    const search = new URLSearchParams(params ?? {}).toString();
    return ApiClient.get(`/pcp/capacidade/setores${search ? `?${search}` : ''}`, token);
  },
  getCapacidadeMaquinas: (token: string, params?: Record<string, string>) => {
    const search = new URLSearchParams(params ?? {}).toString();
    return ApiClient.get(`/pcp/capacidade/maquinas${search ? `?${search}` : ''}`, token);
  },
  getCargaSetor: (setorId: string, token: string, params?: Record<string, string>) => {
    const search = new URLSearchParams(params ?? {}).toString();
    return ApiClient.get(`/pcp/capacidade/setores/${setorId}/carga${search ? `?${search}` : ''}`, token);
  },
  getOcupacaoMaquinasRelatorio: (token: string, params?: Record<string, string>) => {
    const search = new URLSearchParams(params ?? {}).toString();
    return ApiClient.get(`/pcp/relatorios/ocupacao-maquinas${search ? `?${search}` : ''}`, token);
  },
  getPrevistoRealizado: (token: string, params?: Record<string, string>) => {
    const search = new URLSearchParams(params ?? {}).toString();
    return ApiClient.get(`/pcp/relatorios/previsto-realizado${search ? `?${search}` : ''}`, token);
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

export interface CustoIndiretoApi {
  id: string;
  nome: string;
  categoria: string;
  valor_mensal: number;
  ativo: boolean;
  observacoes?: string;
  criado_em?: string;
  atualizado_em?: string;
}

export const custosIndiretosApi = {
  getAll: (token: string) => ApiClient.get<CustoIndiretoApi[]>('/custos-indiretos', token),
  getById: (id: string, token: string) => ApiClient.get(`/custos-indiretos/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/custos-indiretos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/custos-indiretos/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/custos-indiretos/${id}`, token),
};

export const servicosManuaisApi = {
  getAll: (token: string) => ApiClient.get('/servicos-manuais', token),
  getById: (id: string, token: string) => ApiClient.get(`/servicos-manuais/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/servicos-manuais', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/servicos-manuais/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/servicos-manuais/${id}`, token),
};

export const modalidadesEntregaApi = {
  getAll: (token: string, ativo?: boolean) =>
    ApiClient.get(
      `/centros-de-trabalho/modalidades-entrega${
        typeof ativo === 'boolean' ? `?ativo=${ativo}` : ''
      }`,
      token,
    ),
  getById: (id: string, token: string) =>
    ApiClient.get(`/centros-de-trabalho/modalidades-entrega/${id}`, token),
  create: (data: Record<string, unknown>, token: string) =>
    ApiClient.post('/centros-de-trabalho/modalidades-entrega', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) =>
    ApiClient.put(`/centros-de-trabalho/modalidades-entrega/${id}`, data, token),
  delete: (id: string, token: string) =>
    ApiClient.delete(`/centros-de-trabalho/modalidades-entrega/${id}`, token),
};

export const tiposInstalacaoApi = {
  getAll: (token: string, ativo?: boolean) =>
    ApiClient.get(
      `/centros-de-trabalho/tipos-instalacao${
        typeof ativo === 'boolean' ? `?ativo=${ativo}` : ''
      }`,
      token,
    ),
  getById: (id: string, token: string) =>
    ApiClient.get(`/centros-de-trabalho/tipos-instalacao/${id}`, token),
  create: (data: Record<string, unknown>, token: string) =>
    ApiClient.post('/centros-de-trabalho/tipos-instalacao', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) =>
    ApiClient.put(`/centros-de-trabalho/tipos-instalacao/${id}`, data, token),
  delete: (id: string, token: string) =>
    ApiClient.delete(`/centros-de-trabalho/tipos-instalacao/${id}`, token),
};

export const tiposMaterialApi = {
  getAll: (token: string) => ApiClient.get('/tipos-material', token),
  getById: (id: string, token: string) => ApiClient.get(`/tipos-material/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/tipos-material', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.patch(`/tipos-material/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/tipos-material/${id}`, token),
};

const catalogoQuery = (params?: { ativo?: boolean; produto_finito_id?: string }) => {
  const search = new URLSearchParams();
  if (typeof params?.ativo === 'boolean') {
    search.set('ativo', String(params.ativo));
  }
  if (params?.produto_finito_id) {
    search.set('produto_finito_id', params.produto_finito_id);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const catalogoPersonalizacaoApi = {
  getAll: (token: string, params?: { ativo?: boolean }) =>
    ApiClient.get(`/catalogo/personalizacao${catalogoQuery(params)}`, token),
  getById: (id: string, token: string) =>
    ApiClient.get(`/catalogo/personalizacao/${id}`, token),
  create: (data: Record<string, unknown>, token: string) =>
    ApiClient.post('/catalogo/personalizacao', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) =>
    ApiClient.patch(`/catalogo/personalizacao/${id}`, data, token),
  delete: (id: string, token: string) =>
    ApiClient.delete(`/catalogo/personalizacao/${id}`, token),
};

export const catalogoConjuntosCamposApi = {
  getAll: (token: string, params?: { ativo?: boolean }) =>
    ApiClient.get(`/catalogo/conjuntos-campos${catalogoQuery(params)}`, token),
  getById: (id: string, token: string) =>
    ApiClient.get(`/catalogo/conjuntos-campos/${id}`, token),
  create: (data: Record<string, unknown>, token: string) =>
    ApiClient.post('/catalogo/conjuntos-campos', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) =>
    ApiClient.patch(`/catalogo/conjuntos-campos/${id}`, data, token),
  delete: (id: string, token: string) =>
    ApiClient.delete(`/catalogo/conjuntos-campos/${id}`, token),
};

export const catalogoEstampasApi = {
  getAll: (token: string, params?: { ativo?: boolean; produto_finito_id?: string }) =>
    ApiClient.get(`/catalogo/estampas${catalogoQuery(params)}`, token),
  getById: (id: string, token: string) =>
    ApiClient.get(`/catalogo/estampas/${id}`, token),
  create: (data: Record<string, unknown>, token: string) =>
    ApiClient.post('/catalogo/estampas', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) =>
    ApiClient.patch(`/catalogo/estampas/${id}`, data, token),
  delete: (id: string, token: string) =>
    ApiClient.delete(`/catalogo/estampas/${id}`, token),
  uploadArteMestra: (id: string, arquivo: File, token: string) => {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return ApiClient.post(`/catalogo/estampas/${id}/arte-mestra`, formData, token);
  },
};

export const catalogoArteProducaoApi = {
  downloadArteProducao: async (itemOsId: string, token: string) => {
    const url = buildApiUrl(`/catalogo/item-os/${itemOsId}/arte-producao`);
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(await buildErrorMessage(response));
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `arte-producao-${itemOsId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export interface UsuarioPreferencias {
  sidebar_menu_order?: string[];
}

export const usuariosApi = {
  getAll: (token: string) => ApiClient.get('/usuarios', token),
  getById: (id: string, token: string) => ApiClient.get(`/usuarios/${id}`, token),
  create: (data: Record<string, unknown>, token: string) => ApiClient.post('/usuarios', data, token),
  update: (id: string, data: Record<string, unknown>, token: string) => ApiClient.put(`/usuarios/${id}`, data, token),
  delete: (id: string, token: string) => ApiClient.delete(`/usuarios/${id}`, token),
  getPreferencias: (token: string) =>
    ApiClient.get<UsuarioPreferencias>('/usuarios/me/preferencias', token),
  updatePreferencias: (
    data: UsuarioPreferencias,
    token: string,
  ) => ApiClient.patch<UsuarioPreferencias>('/usuarios/me/preferencias', data, token),
  getTwoFactorStatus: (token: string) => ApiClient.get('/usuarios/2fa/status', token),
  setupTwoFactor: (token: string) => ApiClient.post('/usuarios/2fa/setup', {}, token),
  confirmTwoFactor: (code: string, token: string) => ApiClient.post('/usuarios/2fa/confirm', { code }, token),
  disableTwoFactor: (password: string, code: string, token: string) =>
    ApiClient.post('/usuarios/2fa/disable', { password, code }, token),
};
