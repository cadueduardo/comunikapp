// ===== INTERFACES PRINCIPAIS DO MÓDULO CATÁLOGO DE INSUMOS =====

export interface CatalogoInsumo {
  id: string;
  codigo_catalogo: string;
  nome: string;
  descricao_tecnica?: string;
  categoria_global_id?: string;
  marca?: string;
  especificacoes?: Record<string, any>;
  unidade_compra: string;
  unidade_uso: string;
  fator_conversao: number;
  largura?: number;
  altura?: number;
  gramatura?: number;
  unidade_dimensao?: string;
  tipo_calculo?: string;
  logica_consumo: LogicaConsumoInsumo;
  disponibilidade: boolean;
  fonte_coleta?: string;
  data_coleta: Date;
  data_atualizacao: Date;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CategoriaGlobal {
  id: string;
  nome: string;
  descricao?: string;
  categoria_pai_id?: string;
  nivel_hierarquia: number;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FornecedorGlobal {
  id: string;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  website?: string;
  endereco?: string;
  especialidades?: string[];
  ativo: boolean;
  fonte_coleta?: string;
  data_coleta: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ContribuicaoInsumo {
  id: string;
  loja_id: string;
  insumo_id?: string;
  nome: string;
  descricao_tecnica?: string;
  categoria_global_id: string;
  marca?: string;
  especificacoes?: Record<string, any>;
  unidade_compra: string;
  unidade_uso: string;
  fator_conversao: number;
  largura?: number;
  altura?: number;
  gramatura?: number;
  unidade_dimensao?: string;
  tipo_calculo?: string;
  logica_consumo: LogicaConsumoInsumo;
  status: StatusContribuicao;
  observacoes_cliente?: string;
  observacoes_admin?: string;
  aprovado_por?: string;
  data_aprovacao?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ContribuicaoFornecedor {
  id: string;
  loja_id: string;
  fornecedor_id?: string;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  website?: string;
  endereco?: string;
  especialidades?: string[];
  status: StatusContribuicao;
  observacoes_cliente?: string;
  observacoes_admin?: string;
  aprovado_por?: string;
  data_aprovacao?: Date;
  created_at: Date;
  updated_at: Date;
}

// ===== ENUMS =====

export enum LogicaConsumoInsumo {
  AREA = 'area',
  PERIMETRO = 'perimetro',
  QUANTIDADE_FIXA = 'quantidade_fixa',
  LINEAR = 'linear',
  VOLUME = 'volume'
}

export enum StatusContribuicao {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO'
}

// ===== INTERFACES DE RESPOSTA =====

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  module: string;
  timestamp: string;
  uptime: number;
  database: boolean;
  version: string;
  responseTime?: string;
  error?: string;
}

// ===== INTERFACES DE FILTROS =====

export interface BuscarInsumosDto {
  nome?: string;
  categoria_id?: string;
  marca?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface BuscarCategoriasDto {
  nome?: string;
  categoria_pai_id?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
}

export interface BuscarFornecedoresDto {
  nome?: string;
  especialidade?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
}
