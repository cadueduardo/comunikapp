/**
 * Interfaces TypeScript para o módulo OS
 * Definições de tipos isoladas do módulo
 */

// ===== INTERFACES PRINCIPAIS =====

export interface OrdemServicoData {
  id: string;
  numero: string;
  loja_id: string;
  cliente_id: string;
  orcamento_id?: string;
  data_abertura: Date;
  data_prazo?: Date;
  status: StatusOS;
  responsavel_id?: string;
  observacoes?: string;
  nome_servico: string;
  descricao?: string;
  quantidade: number;
  parametros_tecnicos?: ParametrosTecnicos;
  insumos_calculados?: InsumoCalculado[];
  materiais_disponivel: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

export interface CreateOSData {
  cliente_id: string;
  orcamento_id?: string;
  nome_servico: string;
  descricao?: string;
  quantidade: number;
  parametros_tecnicos?: ParametrosTecnicos;
  data_prazo?: Date;
  responsavel_id?: string;
  observacoes?: string;
}

export interface UpdateOSData {
  nome_servico?: string;
  descricao?: string;
  quantidade?: number;
  parametros_tecnicos?: ParametrosTecnicos;
  data_prazo?: Date;
  responsavel_id?: string;
  observacoes?: string;
  status?: StatusOS;
}

// ===== WORKFLOWS =====

export interface WorkflowData {
  id: string;
  loja_id: string;
  nome: string;
  descricao?: string;
  etapas: EtapaWorkflow[];
  ativo: boolean;
  sequencial: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

export interface EtapaWorkflow {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  obrigatoria: boolean;
  tempo_estimado?: number; // em minutos
  responsaveis_permitidos?: string[]; // IDs dos usuários/funções
  checklist?: ChecklistItem[];
  acoes_automaticas?: AcaoAutomatica[];
}

export interface ChecklistItem {
  id: string;
  descricao: string;
  obrigatorio: boolean;
  ordem: number;
}

export interface AcaoAutomatica {
  tipo: 'NOTIFICAR' | 'RESERVAR_ESTOQUE' | 'BAIXAR_ESTOQUE' | 'ATRIBUIR_RESPONSAVEL';
  configuracao: any; // JSON específico por tipo
}

// ===== MOVIMENTAÇÕES =====

export interface MovimentacaoData {
  id: string;
  os_id: string;
  etapa_anterior?: string;
  etapa_atual: string;
  usuario_id: string;
  data_movimentacao: Date;
  observacoes?: string;
  anexos?: AnexoData[];
  ip_origem?: string;
  user_agent?: string;
}

export interface AnexoData {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
}

// ===== PARÂMETROS TÉCNICOS =====

export interface ParametrosTecnicos {
  largura?: number;
  altura?: number;
  area?: number;
  unidade_medida?: string;
  cores?: string[];
  acabamento?: string;
  material?: string;
  observacoes_tecnicas?: string;
  // Campos específicos por tipo de produto
  [key: string]: any;
}

// ===== INSUMOS CALCULADOS =====

export interface InsumoCalculado {
  insumo_id: string;
  nome: string;
  quantidade_necessaria: number;
  unidade: string;
  custo_unitario: number;
  custo_total: number;
  disponivel_estoque: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
}

// ===== INTEGRAÇÕES =====

export interface DadosHerdadosOrcamento {
  orcamento_id: string;
  cliente_id: string;
  nome_servico: string;
  descricao?: string;
  quantidade_produto: number;
  largura_produto?: number;
  altura_produto?: number;
  area_produto?: number;
  unidade_medida_produto?: string;
  horas_producao: number;
  custos_calculados?: any; // JSON do motor de cálculo
  configuracao_calculo?: any; // JSON dos parâmetros
  responsavel_id?: string;
  prioridade?: string;
  prazo_entrega?: string;
  observacoes_internas?: string;
}

export interface ValidacaoEstoque {
  valida: boolean;
  todos_disponiveis: boolean;
  faltantes: InsumoFaltante[];
  reservas_necessarias: ReservaNecessaria[];
}

export interface InsumoFaltante {
  insumo_id: string;
  nome: string;
  quantidade_necessaria: number;
  quantidade_disponivel: number;
  diferenca: number;
}

export interface ReservaNecessaria {
  insumo_id: string;
  quantidade: number;
  observacoes?: string;
}

// ===== NOTIFICAÇÕES =====

export interface NotificacaoOS {
  tipo: TipoNotificacaoOS;
  titulo: string;
  mensagem: string;
  destinatarios: string[]; // IDs dos usuários
  dados_extras?: any;
  urgente?: boolean;
}

// ===== ENUMS =====

export enum StatusOS {
  FILA = 'FILA',
  PRODUCAO = 'PRODUCAO',
  ACABAMENTO = 'ACABAMENTO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
  AGUARDANDO_MATERIAL = 'AGUARDANDO_MATERIAL',
  PAUSADA = 'PAUSADA',
}

export enum TipoMovimentacaoOS {
  CRIACAO = 'CRIACAO',
  AVANCAR_ETAPA = 'AVANCAR_ETAPA',
  RETROCEDER_ETAPA = 'RETROCEDER_ETAPA',
  PAUSAR = 'PAUSAR',
  RETOMAR = 'RETOMAR',
  CANCELAR = 'CANCELAR',
  FINALIZAR = 'FINALIZAR',
  ATRIBUIR_RESPONSAVEL = 'ATRIBUIR_RESPONSAVEL',
  ADICIONAR_OBSERVACAO = 'ADICIONAR_OBSERVACAO',
}

export enum TipoNotificacaoOS {
  OS_CRIADA = 'OS_CRIADA',
  OS_ETAPA_AVANCADA = 'OS_ETAPA_AVANCADA',
  OS_MATERIAL_FALTANDO = 'OS_MATERIAL_FALTANDO',
  OS_PRAZO_VENCENDO = 'OS_PRAZO_VENCENDO',
  OS_FINALIZADA = 'OS_FINALIZADA',
  OS_CANCELADA = 'OS_CANCELADA',
  OS_PROBLEMA_PRODUCAO = 'OS_PROBLEMA_PRODUCAO',
  OS_ATRIBUIDA = 'OS_ATRIBUIDA',
}

// ===== RESPOSTA DE APIS =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== CONFIGURAÇÕES =====

export interface OSModuleConfig {
  moduleName: string;
  version: string;
  isolated: boolean;
  multiTenant: boolean;
  description: string;
  features: string[];
}
