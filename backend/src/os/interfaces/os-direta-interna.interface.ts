/**
 * Interfaces para OS Direta e Interna
 * Objetivo: Tipagem TypeScript para novos campos conforme PLANO Fase 1
 */

export enum TipoOS {
  COMERCIAL = 'COMERCIAL',
  INTERNA = 'INTERNA'
}

export enum OrigemOS {
  ORCAMENTO = 'ORCAMENTO',
  DIRETA = 'DIRETA',
  INTERNA = 'INTERNA'
}

export enum PrioridadeOS {
  URGENTE = 'URGENTE',
  ALTA = 'ALTA',
  NORMAL = 'NORMAL',
  BAIXA = 'BAIXA'
}

export enum StatusAprovacao {
  PENDENTE = 'PENDENTE',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA'
}

/**
 * Interface para campos específicos de OS Interna
 */
export interface CamposOSInterna {
  departamento_solicitante?: string;
  centro_custo?: string;
  projeto_interno?: string;
  aprovacao_gerencial?: StatusAprovacao;
  aprovacao_gerencial_por?: string;
  aprovacao_gerencial_em?: Date;
  aprovacao_gerencial_obs?: string;
}

/**
 * Interface para campos específicos de OS Comercial
 */
export interface CamposOSComercial {
  valor_orcado?: number;
  valor_realizado?: number;
  margem_lucro_real?: number;
  data_entrega_cliente?: Date;
  satisfacao_cliente?: number; // 1-5
  observacoes_cliente?: string;
}

/**
 * Interface para campos de controle e auditoria
 */
export interface CamposControleOS {
  criado_por?: string;
  modificado_por?: string;
  motivo_modificacao?: string;
  versao: number;
}

/**
 * Interface completa para OS com todos os campos
 */
export interface OrdemServicoCompleta {
  // Campos básicos existentes
  id: string;
  numero: string;
  loja_id: string;
  cliente_id: string;
  orcamento_id?: string;
  data_abertura: Date;
  data_prazo?: Date;
  status: string;
  responsavel_id?: string;
  observacoes?: string;
  criado_em: Date;
  atualizado_em: Date;
  
  // Campos específicos do produto/serviço
  nome_servico: string;
  descricao?: string;
  quantidade: number;
  parametros_tecnicos?: string;
  insumos_calculados?: string;
  materiais_disponivel: boolean;
  
  // Campos de aprovação técnica
  aprovacao_tecnica_status?: StatusAprovacao;
  aprovacao_tecnica_por?: string;
  aprovacao_tecnica_em?: Date;
  aprovacao_tecnica_obs?: string;
  
  // Campos de agendamento de instalação
  data_instalacao_agendada?: Date;
  observacoes_instalacao?: string;
  
  // Novos campos para diferenciação
  tipo_os: TipoOS;
  origem_os?: OrigemOS;
  prioridade: PrioridadeOS;
  
  // Campos específicos por tipo
  campos_interna?: CamposOSInterna;
  campos_comercial?: CamposOSComercial;
  
  // Campos de controle
  controle: CamposControleOS;
}

/**
 * DTO para criação de OS Direta
 */
export interface CreateOSDiretaDto {
  loja_id: string;
  cliente_id: string;
  orcamento_id?: string;
  nome_servico: string;
  descricao?: string;
  quantidade: number;
  parametros_tecnicos?: string;
  prioridade?: PrioridadeOS;
  observacoes?: string;
  responsavel_id?: string;
  
  // Campos específicos comerciais
  valor_orcado?: number;
  data_entrega_cliente?: Date;
  
  // Campos de controle
  criado_por?: string;
}

/**
 * DTO para criação de OS Interna
 */
export interface CreateOSInternaDto {
  loja_id: string;
  departamento_solicitante: string;
  centro_custo: string;
  projeto_interno?: string;
  nome_servico: string;
  descricao?: string;
  quantidade: number;
  parametros_tecnicos?: string;
  prioridade?: PrioridadeOS;
  observacoes?: string;
  responsavel_id?: string;
  
  // Campos de controle
  criado_por?: string;
}

/**
 * DTO para atualização de OS
 */
export interface UpdateOSDto {
  status?: string;
  responsavel_id?: string;
  observacoes?: string;
  data_prazo?: Date;
  parametros_tecnicos?: string;
  insumos_calculados?: string;
  materiais_disponivel?: boolean;
  
  // Campos de aprovação técnica
  aprovacao_tecnica_status?: StatusAprovacao;
  aprovacao_tecnica_por?: string;
  aprovacao_tecnica_obs?: string;
  
  // Campos de agendamento
  data_instalacao_agendada?: Date;
  observacoes_instalacao?: string;
  
  // Campos específicos por tipo
  campos_interna?: Partial<CamposOSInterna>;
  campos_comercial?: Partial<CamposOSComercial>;
  
  // Campos de controle
  modificado_por?: string;
  motivo_modificacao?: string;
}

/**
 * DTO para aprovação gerencial de OS Interna
 */
export interface AprovacaoGerencialDto {
  aprovacao_gerencial: StatusAprovacao;
  aprovacao_gerencial_por: string;
  aprovacao_gerencial_obs?: string;
  modificado_por?: string;
  motivo_modificacao?: string;
}

/**
 * DTO para finalização de OS Comercial
 */
export interface FinalizacaoOSComercialDto {
  valor_realizado?: number;
  data_entrega_cliente?: Date;
  satisfacao_cliente?: number;
  observacoes_cliente?: string;
  modificado_por?: string;
  motivo_modificacao?: string;
}

/**
 * Filtros para busca de OS
 */
export interface FiltrosOSDto {
  loja_id?: string;
  tipo_os?: TipoOS;
  origem_os?: OrigemOS;
  prioridade?: PrioridadeOS;
  status?: string;
  departamento_solicitante?: string;
  centro_custo?: string;
  aprovacao_gerencial?: StatusAprovacao;
  data_inicio?: Date;
  data_fim?: Date;
  responsavel_id?: string;
  criado_por?: string;
}

/**
 * Estatísticas de OS por tipo
 */
export interface EstatisticasOSTipo {
  total_comercial: number;
  total_interna: number;
  aprovadas_comercial: number;
  aprovadas_interna: number;
  pendentes_comercial: number;
  pendentes_interna: number;
  rejeitadas_comercial: number;
  rejeitadas_interna: number;
}

/**
 * Relatório de performance por departamento (OS Interna)
 */
export interface RelatorioDepartamento {
  departamento: string;
  total_os: number;
  aprovadas: number;
  pendentes: number;
  rejeitadas: number;
  tempo_medio_aprovacao: number; // em horas
  custo_total: number;
}

/**
 * Relatório de performance comercial
 */
export interface RelatorioComercial {
  total_os: number;
  valor_total_orcado: number;
  valor_total_realizado: number;
  margem_lucro_media: number;
  satisfacao_media: number;
  tempo_medio_entrega: number; // em dias
}
