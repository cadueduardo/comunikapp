/**
 * Interfaces para o sistema de validações automáticas
 */

export interface CondicaoRegra {
  campo: string;
  operador: 'equals' | 'greater_than' | 'greater_than_or_equal' | 'less_than' | 'less_than_or_equal' | 'contains' | 'not_equals' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  valor: any;
  mensagem_erro?: string;
  mensagem_alerta?: string;
  expressao?: string; // Para cálculos complexos
}

export interface AcaoRegra {
  tipo: 'bloquear' | 'notificar' | 'aprovar' | 'corrigir' | 'alertar';
  status_os?: string;
  notificar?: string[];
  parametros?: Record<string, any>;
  delay?: number; // Delay em segundos
}

export interface RegraValidacao {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'VALIDACAO' | 'ALERTA' | 'CORRECAO' | 'APROVACAO';
  categoria: 'ESTOQUE' | 'ARTE' | 'DADOS' | 'PRAZO' | 'FINANCEIRO' | 'TECNICO' | 'COMERCIAL';
  ativo: boolean;
  prioridade: number;
  loja_id?: string;
  condicoes: CondicaoRegra;
  acoes: AcaoRegra;
  criado_em: Date;
  atualizado_em: Date;
  criado_por?: string;
  atualizado_por?: string;
}

export interface ExecucaoRegra {
  id: string;
  regra_id: string;
  os_id: string;
  resultado: 'SUCESSO' | 'ERRO' | 'ALERTA' | 'BLOQUEIO';
  mensagem?: string;
  dados_execucao?: Record<string, any>;
  tempo_execucao: number; // ms
  criado_em: Date;
}

export interface ResultadoValidacao {
  valida: boolean;
  pode_aprovar_automaticamente: boolean;
  correcoes_necessarias: string[];
  alertas: string[];
  acoes: AcaoRegra[];
  execucoes: Array<{
    regra_id: string;
    regra_nome: string;
    resultado: string;
    mensagem?: string;
    tempo_execucao: number;
  }>;
}

export interface DashboardValidacoes {
  totalRegras: number;
  regrasAtivas: number;
  execucoesHoje: number;
  taxaSucesso: number;
  regrasPorCategoria: Array<{
    categoria: string;
    total: number;
    ativas: number;
  }>;
  execucoesRecentes: ExecucaoRegra[];
}

export interface FiltrosRegras {
  loja_id?: string;
  categoria?: string;
  ativo?: boolean;
  busca?: string;
  page?: number;
  limit?: number;
}




