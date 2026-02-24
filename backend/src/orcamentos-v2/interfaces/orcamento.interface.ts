// Interfaces principais para orçamentos V2
// Seguindo padrões do projeto e integração com motor de cálculo

export interface OrcamentoBase {
  id: string;
  numero: string;
  titulo: string;
  descricao?: string;
  cliente_id: string;
  loja_id: string;
  status: OrcamentoStatus;
  status_aprovacao?: string;
  tipo: OrcamentoTipo;
  tipo_orcamento?: OrcamentoTipo;
  data_criacao: Date;
  data_atualizacao: Date;
  data_validade?: Date;
  observacoes?: string;
  tags?: string[];
  prioridade: PrioridadeOrcamento;
  responsavel_id?: string;
  ativo?: boolean;
  custos_calculados?: any;
  detalhamento_calculo?: any;
  alertas?: any[];
  data_ultimo_calculo?: Date;

  // Campos do produto principal
  largura_produto?: number;
  altura_produto?: number;
  area_produto?: number;
  quantidade_produto?: number;
  unidade_medida_produto?: string;
}

export interface OrcamentoCompleto extends OrcamentoBase {
  // Dados do cliente
  cliente: ClienteInfo;

  // Produtos e itens
  produtos: ProdutoOrcamento[];

  // Custos calculados
  custos: CustosOrcamento;

  // Configurações de cálculo
  configuracoes: ConfiguracaoCalculo;

  // Histórico e versões
  versoes: VersaoOrcamento[];
  historicoOrcamento: HistoricoOrcamento[];

  // Sistema de aprovação
  aprovacoes: AprovacaoOrcamento[];

  // Links públicos
  linksPublicos: LinkPublico[];

  // Chat e negociação
  mensagensChat: MensagemChat[];

  // Arquivos e anexos
  anexos: AnexoOrcamento[];
}

export interface ProdutoOrcamento {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  unidade: string;
  largura?: number;
  altura?: number;
  area?: number;
  insumos: ItemInsumo[];
  maquinas: ItemMaquina[];
  funcoes: ItemFuncao[];
  servicos_manuais: ItemServicoManual[];
  custos_indiretos: ItemCustoIndireto[];
  preco_unitario: number;
  preco_total: number;
  margem_lucro: number;
  impostos: number;
  observacoes?: string;
}

export interface ItemInsumo {
  insumo_id: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  preco_total: number;
  estoque_disponivel?: number;
  alerta_estoque?: boolean;
}

export interface ItemMaquina {
  maquina_id: string;
  tempo_horas: number;
  custo_hora: number;
  custo_total: number;
}

export interface ItemFuncao {
  funcao_id: string;
  tempo_horas: number;
  custo_hora: number;
  custo_total: number;
}

export interface ItemServicoManual {
  servico_id: string;
  tempo_horas: number;
  custo_hora: number;
  custo_total: number;
}

export interface ItemCustoIndireto {
  custo_id: string;
  percentual: number;
  valor_fixo?: number;
  custo_total: number;
}

export interface CustosOrcamento {
  custos_diretos: {
    insumos: number;
    maquinas: number;
    funcoes: number;
    servicos_manuais: number;
    subtotal: number;
  };
  custos_indiretos: number;
  impostos: number;
  margem_lucro: number;
  custo_total: number;
  preco_final: number;
  lucro_estimado: number;
}

export interface ConfiguracaoCalculo {
  margem_lucro_padrao: number;
  impostos_padrao: number;
  custos_indiretos_padrao: number;
  horas_produtivas_mensais: number;
  custos_indiretos_mensais?: number;
  regras_especiais?: RegraCalculo[];
}

export interface RegraCalculo {
  id: string;
  tipo: TipoRegra;
  condicao: string;
  acao: string;
  parametros: Record<string, any>;
  ativo: boolean;
}

export interface VersaoOrcamento {
  numero: number;
  data_criacao: Date;
  responsavel_id: string;
  mudancas: string[];
  custos_anteriores: CustosOrcamento;
  custos_novos: CustosOrcamento;
}

export interface HistoricoOrcamento {
  id: string;
  data: Date;
  tipo: TipoHistorico;
  descricao: string;
  usuario_id: string;
  dados_anteriores?: any;
  dados_novos?: any;
}

export interface AprovacaoOrcamento {
  id: string;
  nivel: number;
  responsavel_id: string;
  status: StatusAprovacao;
  data_aprovacao?: Date;
  observacoes?: string;
  condicoes?: string[];
}

export interface LinkPublico {
  id: string;
  orcamento_id?: string;
  criado_por?: string;
  token: string;
  data_expiracao?: Date;
  ativo: boolean;
  permissoes: PermissaoLink[];
  max_visualizacoes?: number;
  data_criacao?: Date;
  visualizacoes?: number;
  senha?: boolean | string;
  orcamento?: any;
  criado_por_usuario?: any;
}

export interface MensagemChat {
  id: string;
  usuario_id: string;
  tipo: TipoMensagem;
  conteudo: string;
  data_envio: Date;
  lida: boolean;
  anexos?: string[];
}

export interface AnexoOrcamento {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  data_upload: Date;
  usuario_id: string;
}

export interface ClienteInfo {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cpf_cnpj?: string;
}

export interface DadosHerdadosOrcamento {
  orcamento_id: string;
  cliente_id: string;
  loja_id: string;
  nome_servico: string;
  descricao?: string;
  quantidade_produto: number;
  largura_produto?: number;
  altura_produto?: number;
  area_produto?: number;
  unidade_medida_produto?: string;
  horas_producao: number;
  custos_calculados?: any;
  configuracao_calculo?: any;
  responsavel_id?: string;
  prioridade?: PrioridadeOrcamento;
  prazo_entrega?: string;
  observacoes_internas?: string;
  tipo_orcamento?: OrcamentoTipo;
  tags?: string[];
  data_validade?: Date;
  configuracoes?: ConfiguracaoCalculo;
}

// Enums
export enum OrcamentoStatus {
  RASCUNHO = 'rascunho',
  EM_ANALISE = 'em_analise',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  EM_EXECUCAO = 'em_execucao',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

export enum OrcamentoTipo {
  PRODUTO = 'produto',
  SERVICO = 'servico',
  PRODUTO_SERVICO = 'produto_servico',
}

export enum PrioridadeOrcamento {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum TipoRegra {
  VALIDACAO = 'validacao',
  CALCULO = 'calculo',
  APROVACAO = 'aprovacao',
  NOTIFICACAO = 'notificacao',
}

export enum TipoHistorico {
  CRIACAO = 'criacao',
  EDICAO = 'edicao',
  STATUS = 'status',
  APROVACAO = 'aprovacao',
  CALCULO = 'calculo',
}

export enum StatusAprovacao {
  PENDENTE = 'pendente',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  CONDICIONAL = 'condicional',
}

export enum TipoMensagem {
  TEXTO = 'texto',
  SISTEMA = 'sistema',
  NOTIFICACAO = 'notificacao',
  ARQUIVO = 'arquivo',
}

export enum PermissaoLink {
  VISUALIZAR = 'visualizar',
  COMENTAR = 'comentar',
  APROVAR = 'aprovar',
  EDITAR = 'editar',
}
