// Tipos e interfaces compartilhadas entre orçamentos e produtos

export interface Cliente {
  id: string;
  nome: string;
}

export interface Insumo {
  id: string;
  nome: string;
  unidade_compra: string;
  custo_unitario: number;
  quantidade_compra: number;
  unidade_uso: string;
  fator_conversao: number;
  largura?: number | null;
  altura?: number | null;
  unidade_dimensao?: string | null;
  tipo_calculo?: string | null;
  gramatura?: number | null;
  logica_consumo?: string | null;
  tipoMaterial?: {
    id: string;
    nome: string;
    logica_consumo: string;
    parametros_padrao: Record<string, unknown> | null;
  } | null;
  categoria: {
    nome: string;
  };
}

export interface Maquina {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number;
  status: string;
}

export interface Funcao {
  id: string;
  nome: string;
  custo_hora: number;
  descricao?: string;
  maquina?: {
    nome: string;
  };
} 