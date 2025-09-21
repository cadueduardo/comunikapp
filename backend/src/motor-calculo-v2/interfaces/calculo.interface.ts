// Interfaces para o Motor de Cálculo V2
// Base para o sistema de regras e pipeline configurável

export interface ContextoCalculo {
  id: string;
  lojaId: string;
  produtos: ProdutoCalculo[];
  configuracoes: ConfiguracaoCalculo;
  cache: Map<string, any>;
  metadata: MetadataCalculo;
}

export interface ProdutoCalculo {
  id: string;
  nome: string;
  nome_servico: string;
  quantidade: number;
  insumos: InsumoCalculo[];
  maquinas: MaquinaCalculo[];
  funcoes: FuncaoCalculo[];
  servicos_manuais: ServicoManualCalculo[];
  custos_indiretos: CustoIndiretoCalculo[];
  metadata?: any;
}

export interface InsumoCalculo {
  id: string;
  nome: string;
  unidade: string;
  preco_unitario: number;
  quantidade: number;
  categoria: string;
  fornecedor: string;
  estoque_disponivel: number;
}

export interface MaquinaCalculo {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number;
  tempo_setup: number;
  eficiencia: number;
  disponivel: boolean;
}

export interface FuncaoCalculo {
  id: string;
  nome: string;
  categoria: string;
  custo_hora: number;
  tempo_estimado: number;
  nivel_experiencia: string;
  disponivel: boolean;
}

export interface ServicoManualCalculo {
  id: string;
  horas: number;
  custo_por_hora: number;
}

export interface CustoIndiretoCalculo {
  id: string;
  percentual: number;
  valor_fixo?: number;
}

export interface ConfiguracaoCalculo {
  margem_lucro_padrao: number;
  impostos_padrao: number;
  comissao_padrao: number;
  custos_indiretos_padrao: number;
  desconto_padrao: number;
  prazo_entrega_padrao: number;
  unidade_monetaria: string;
  timezone: string;
  regras_especiais?: RegraEspecial[];
}

export interface RegraEspecial {
  id: string;
  tipo: string;
  condicao: string;
  acao: string;
  parametros: Record<string, any>;
}

export type TipoEvento =
  | 'calculo_iniciado'
  | 'estagio_executado'
  | 'regra_aplicada'
  | 'calculo_concluido'
  | 'erro'
  | 'validacao';

export interface MetadataCalculo {
  timestamp_criacao: Date;
  usuario_id?: string;
  versao_motor: string;
  modo_calculo: 'orcamento' | 'produto' | 'preview';
  tempo_producao?: number;
  versao?: string;
  origem?: string;
  estagios_executados?: string[];
  regras_aplicadas?: string[];
  inputs_integrados?: boolean;
  timestamp_integracao?: Date;
}

export interface ResultadoCalculo {
  id: string;
  contexto_id: string;
  produtos: ResultadoProduto[];
  resumo: ResumoCalculo;
  recursos_compartilhados: RecursosCompartilhados;
  contexto_comercial: ContextoComercial;
  metadata: MetadataResultado;
  trace?: TraceCalculo[];
}

export interface ResultadoProduto {
  produto_id: string;
  nome_servico: string;
  quantidade: number;
  custos: CustosProduto;
  tempo_producao: number;
  preco_unitario: number;
  preco_total: number;
}

export interface CustosProduto {
  custo_material: number;
  custo_mao_obra: number;
  custo_maquinaria: number;
  custo_indireto: number;
  custo_total_producao: number;
  margem_lucro_valor: number;
  subtotal_com_lucro: number;
  impostos_valor: number;
  preco_final: number;
}

export interface ResumoCalculo {
  custo_total_materiais: number;
  custo_total_mao_obra: number;
  custo_total_maquinaria: number;
  custo_total_indiretos: number;
  custo_total_producao: number;
  margem_lucro_total: number;
  subtotal_com_lucro: number;
  impostos_total: number;
  preco_final: number;
  tempo_total_producao: number;
}

export interface RecursosCompartilhados {
  materiais_consolidados: any[];
  maquinas_consolidadas: any[];
  funcoes_consolidadas: any[];
}

export interface ContextoComercial {
  margem_lucro_aplicada: number;
  impostos_aplicados: number;
  descontos?: number;
  acrescimos?: number;
}

export interface MetadataResultado {
  timestamp_calculo: Date;
  versao_motor: string;
  tempo_execucao_ms: number;
  estagios_executados: string[];
}

export interface TraceCalculo {
  estagio: string;
  timestamp: Date;
  entrada: any;
  saida: any;
  tempo_execucao_ms: number;
  memoria_utilizada: number;
  versao: string;
}

// Interfaces para o Sistema de Regras
export interface RegraCalculo {
  id: string;
  nome: string;
  tipo: 'validacao' | 'calculo' | 'transformacao';
  condicao: string;
  acao: string;
  parametros: Record<string, any>;
  ordem: number;
  ativo: boolean;
  loja_id: string;
}

export interface ResultadoRegras {
  regras_aplicadas: RegraCalculo[];
  resultado_validacao: boolean;
  erros: string[];
  avisos: string[];
  dados_transformados: any;
}

// Interfaces para o Pipeline de Estágios
export interface EstagioCalculo {
  id: string;
  nome: string;
  ordem: number;
  ativo: boolean;
  configuracao: ConfiguracaoEstagio;
  executar(contexto: ContextoCalculo, resultado: any): Promise<ResultadoEstagio>;
  validar(contexto: ContextoCalculo): Promise<ValidationResult>;
}

export interface ConfiguracaoEstagio {
  margem_lucro_padrao?: number;
  impostos_padrao?: number;
  custos_indiretos_padrao?: number;
  regras_especiais?: RegraEspecial[];
}

export interface ResultadoEstagio {
  estagio: string;
  sucesso: boolean;
  dados: any;
  deltas: any;
  tempo_execucao: number;
  memoria_utilizada: number;
  executado_em: Date;
  versao: string;
}

export interface ValidationResult {
  valido: boolean;
  erros: string[];
  avisos: string[];
}

// Interfaces para Eventos
export interface EventoCalculo {
  id: string;
  tipo: string;
  timestamp: Date;
  contexto: ContextoCalculo;
  dados: any;
  resultado?: any;
  erro?: string;
  metadata: {
    usuario_id?: string;
    sessao_id?: string;
    versao_motor: string;
    tempo_producao?: number;
    versao?: string;
    origem?: string;
  };
}

// DTOs para entrada
export interface DTOCalculo {
  lojaId: string;
  produtos: ProdutoCalculo[];
  configuracoes: ConfiguracaoCalculo;
  metadata?: MetadataCalculo;
}

// Resultado simplificado
export interface ResultadoCalculoSimplificado {
  sucesso: boolean;
  custo_total: number;
  tempo_total: number;
  resumo: {
    materiais: number;
    mao_obra: number;
    maquinaria: number;
    indiretos: number;
  };
  metadata: {
    timestamp: Date;
    versao_motor: string;
    tempo_execucao_ms: number;
  };
}
