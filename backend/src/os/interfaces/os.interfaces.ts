/**
 * Interfaces TypeScript para o modulo OS
 * Definicoes de tipos isoladas do modulo
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
  quantidade: number | any; // Prisma retorna Decimal
  parametros_tecnicos?: ParametrosTecnicos | string; // Prisma retorna string
  insumos_calculados?: InsumoCalculado[] | string; // Prisma retorna string
  materiais_disponivel: boolean;
  criado_em: Date;
  atualizado_em: Date;
  alertas_estoque?: string[];
  recomendacoes_estoque?: string[];
  detalhes_estoque?: EstoqueValidacaoDetalhe[];

  // Novos campos para OS Direta/Interna
  tipo_os?: string;
  origem_os?: string;
  prioridade?: string;
  departamento_solicitante?: string;
  centro_custo?: string;
  projeto_interno?: string;
  aprovacao_gerencial?: string;
  aprovacao_gerencial_por?: string;
  aprovacao_gerencial_em?: Date;
  aprovacao_gerencial_obs?: string;
  valor_orcado?: number | any; // Prisma retorna Decimal
  valor_realizado?: number | any; // Prisma retorna Decimal
  margem_lucro_real?: number | any; // Prisma retorna Decimal
  data_entrega_cliente?: Date;
  satisfacao_cliente?: number;
  observacoes_cliente?: string;
  criado_por?: string;
  modificado_por?: string;
  motivo_modificacao?: string;
  versao?: number;
  aprovacao_tecnica_status?: string;
  aprovacao_tecnica_por?: string;
  aprovacao_tecnica_em?: Date;
  aprovacao_tecnica_obs?: string;
  data_instalacao_agendada?: Date;
  observacoes_instalacao?: string;

  // Novos campos estruturados para frontend
  cliente?: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
  };
  cliente_nome?: string; // Para compatibilidade com Grid
  produtos?: ProdutoOSData[];
  itens_os?: ItemOSData[];
  materiais_consolidados?: MaterialConsolidadoData[];
}

export interface ItemOSData {
  id: string;
  os_id: string;
  produto_servico: string;
  quantidade: number;
  parametros_tecnicos?: any;
  insumos_necessarios?: InsumoCalculado[] | string | null;
  materiais_disponivel: boolean;
  observacoes?: string;
  largura?: number;
  altura?: number;
  // Fase 11: profundidade opcional para produtos 3D (totens, letras caixa, displays).
  // Coluna `profundidade` em `itens_os` adicionada na migration 20260526090000_add_profundidade_item_os.
  profundidade?: number;
  area?: number;
  perimetro?: number;
  unidade_medida?: string;
  unidade_geometria?: string;
  geometria_origem?: string;
  arquivo_geometria_url?: string;
  arquivo_geometria_metadados?: string;
  data_inicio_producao?: Date;
  data_prazo_produto?: Date;
  status_liberacao_pcp?: string;
  liberado_pcp_por?: string;
  liberado_pcp_em?: Date;
  prioridade_produto?: string;
  ordem_producao?: number;
}

export interface ProdutoOSData {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  unidade_medida?: string;
  largura?: number;
  altura?: number;
  profundidade?: number;
  area_produto?: number;
  perimetro_produto?: number;
  unidade_geometria?: string;
  geometria_origem?: string;
  arquivo_geometria_url?: string;
  observacoes?: string;
  materiais: MaterialProdutoData[];
  maquinas: MaquinaProdutoData[];
  funcoes: FuncaoProdutoData[];
}

export interface MaterialProdutoData {
  id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  display: string;
  categoria: string;
  tipo_material?: string;
  parametros_consumo?: any;
  disponivel_estoque?: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
  custo_unitario?: number;
  custo_total?: number;
}

export interface MaquinaProdutoData {
  id: string;
  nome: string;
  horas_uso: number;
  custo_hora: number;
  custo_total: number;
}

export interface FuncaoProdutoData {
  id: string;
  nome: string;
  horas_uso: number;
  custo_hora: number;
  custo_total: number;
}

export interface MaterialConsolidadoData {
  id: string;
  nome: string;
  quantidade_total: number;
  unidade: string;
  display: string;
  categoria: string;
  tipo_material?: string;
  parametros_consumo?: any;
  disponivel_estoque?: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
  produtos: {
    nome: string;
    quantidade: number;
    quantidade_material: number;
  }[];
}

export interface EstoqueValidacaoDetalhe {
  insumo_id: string;
  nome?: string;
  categoria?: string;
  fornecedor?: string;
  estoque_atual?: number;
  estoque_minimo?: number;
  quantidade_necessaria?: number;
  quantidade_disponivel?: number;
  percentual_disponivel?: number;
  unidade?: string;
  alerta_estoque?: boolean;
  alerta_estoque_minimo?: boolean;
  alerta_fornecedor?: boolean;
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
  responsaveis_permitidos?: string[]; // IDs dos usuarios/funcoes
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
  tipo:
    | 'NOTIFICAR'
    | 'RESERVAR_ESTOQUE'
    | 'BAIXAR_ESTOQUE'
    | 'ATRIBUIR_RESPONSAVEL';
  configuracao: any; // JSON especifico por tipo
}

// ===== MOVIMENTACOES =====

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

// ===== PARAMETROS TECNICOS =====

export interface ParametrosTecnicos {
  largura?: number;
  altura?: number;
  area?: number;
  unidade_medida?: string;
  cores?: string[];
  acabamento?: string;
  material?: string;
  observacoes_tecnicas?: string;
  // Campos especificos por tipo de produto
  [key: string]: any;
}

// ===== INSUMOS CALCULADOS =====

export interface InsumoCalculado {
  insumo_id: string;
  nome: string;
  quantidade_necessaria: number;
  unidade: string;
  display: string;
  custo_unitario: number;
  custo_total: number;
  produto_nome: string; // Nome do produto para rastreabilidade
  logica_consumo?: string; // Lógica de consumo do insumo
  parametros_consumo?: any; // Parâmetros de consumo do insumo
  origem: 'orcamento' | 'os'; // Origem do cálculo
  orcamento_id?: string; // ID do orçamento de origem
  data_calculo?: Date; // Data do cálculo do orçamento
  disponivel_estoque: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
}

// ===== INTEGRACOES =====

export interface DadosHerdadosOrcamento {
  orcamento_id: string;
  cliente_id: string;
  nome_servico: string;
  descricao?: string;
  quantidade_produto: number;
  largura_produto?: number;
  altura_produto?: number;
  area_produto?: number;
  perimetro_produto?: number;
  unidade_geometria?: string;
  geometria_origem?: string;
  arquivo_geometria_url?: string;
  arquivo_geometria_metadados?: string;
  unidade_medida_produto?: string;
  horas_producao: number;
  custos_calculados?: any; // JSON do motor de calculo
  configuracao_calculo?: any; // JSON dos parametros
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

// ===== NOTIFICACOES =====

export interface NotificacaoOS {
  tipo: TipoNotificacaoOS;
  titulo: string;
  mensagem: string;
  destinatarios: string[]; // IDs dos usuarios
  dados_extras?: any;
  urgente?: boolean;
}

// ===== ENUMS =====

export enum StatusOS {
  FILA = 'FILA',
  AGUARDANDO_APROVACAO_TECNICA = 'AGUARDANDO_APROVACAO_TECNICA',
  APROVADA_TECNICA = 'APROVADA_TECNICA',
  AGUARDANDO_APROVACAO_ORCAMENTARIA = 'AGUARDANDO_APROVACAO_ORCAMENTARIA',
  APROVADA_ORCAMENTARIA = 'APROVADA_ORCAMENTARIA',
  REJEITADA = 'REJEITADA',
  LIBERADA_PARA_PCP = 'LIBERADA_PARA_PCP',
  EM_WORKFLOW = 'EM_WORKFLOW',
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
  APROVACAO_TECNICA = 'APROVACAO_TECNICA',
  APROVACAO_ORCAMENTARIA = 'APROVACAO_ORCAMENTARIA',
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

// ===== CONFIGURACOES =====

export interface OSModuleConfig {
  moduleName: string;
  version: string;
  isolated: boolean;
  multiTenant: boolean;
  description: string;
  features: string[];
}
