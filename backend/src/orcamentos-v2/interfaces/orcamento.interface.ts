// Interfaces principais para orçamentos V2
// Seguindo padrões do projeto e integração com motor de cálculo

export interface OrcamentoBase {
  id: string;
  titulo: string;
  descricao?: string;
  cliente_id: string;
  loja_id: string;
  status: OrcamentoStatus;
  tipo: OrcamentoTipo;
  data_criacao: Date;
  data_atualizacao: Date;
  data_validade?: Date;
  observacoes?: string;
  tags?: string[];
  prioridade: PrioridadeOrcamento;
  responsavel_id?: string;
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
  historico: HistoricoOrcamento[];
  
  // Sistema de aprovação
  aprovacoes: AprovacaoOrcamento[];
  
  // Links públicos
  links: LinkPublico[];
  
  // Chat e negociação
  mensagens: MensagemChat[];
  
  // Arquivos e anexos
  anexos: AnexoOrcamento[];
}

export interface ProdutoOrcamento {
  id: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  unidade: string;
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
  codigo: string;
  url: string;
  data_expiracao?: Date;
  max_acessos?: number;
  acessos_restantes: number;
  ativo: boolean;
  permissoes: PermissaoLink[];
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
