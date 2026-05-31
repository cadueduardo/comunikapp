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
  tipo_material_id?: string | null;
  parametros_consumo?: Record<string, unknown> | null;
  tipoMaterial?: {
    id: string;
    nome: string;
    logica_consumo: string;
    parametros_padrao: Record<string, unknown> | null;
  } | null;
  categoria: {
    nome: string;
  };
  formato_material?: string | null;
  largura_comercial?: number | null;
  altura_comercial?: number | null;
  comprimento_comercial?: number | null;
  perda_padrao_percent?: number | null;
  permite_simulacao_chapa?: boolean;
  permite_registrar_sobra?: boolean;
  metodo_cobranca_padrao?: string | null;
  controla_estoque?: boolean;
}

export interface Maquina {
  id: string;
  nome: string;
  tipo: string;
  custo_hora: number;
  status?: string;
  modo_producao?: 'M2_H' | 'ML_H' | 'MANUAL';
  velocidade_m2_h?: number | string | null;
  velocidade_ml_h?: number | string | null;
  eficiencia_percent?: number | string | null;
  setup_min?: number | string | null;
}

export interface Funcao {
  id: string;
  nome: string;
  custo_hora: number;
  descricao?: string;
  maquina?: {
    nome: string;
  };
  // Campos do Centro de Trabalho
  tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'MANUAL';
  fator_acompanhamento?: number | string;
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
}

export interface ServicoManual {
  id: string;
  nome: string;
  descricao?: string;
  custo_hora: number | string;
  tipo_calculo?: 'ACOMPANHA_MAQUINA' | 'POR_M2' | 'POR_UNIDADE' | 'POR_PECA_COM_CATEGORIA' | 'MANUAL';
  horas_por_m2?: number | string;
  horas_por_unidade?: number | string;
  eficiencia_percent?: number | string;
  setup_min?: number | string;
  categorias?: Array<{
    nome: string;
    ate_m2: number;
    tempo_min: number | string;
  }>;
  criado_em?: string;
}
