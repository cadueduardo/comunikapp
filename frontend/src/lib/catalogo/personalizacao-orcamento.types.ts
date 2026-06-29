export type FaixaPreco = {
  min: number;
  max?: number | null;
  preco: number;
};

export type CampoVariavelDefOrcamento = {
  id: string;
  chave: string;
  label: string;
  tipo: 'TEXTO' | 'NUMERO' | 'DATA';
  obrigatorio: boolean;
  max_caracteres?: number | null;
  ordem: number;
  placeholder?: string | null;
};

export type ProcessoDecoracaoOrcamento = {
  id: string;
  nome: string;
  codigo?: string | null;
  custo_setup?: number | string | null;
  preco_base?: number | string | null;
  faixas_preco?: FaixaPreco[] | null;
};

export type EstampaOrcamento = {
  id: string;
  nome: string;
  codigo?: string | null;
  preco_adicional?: number | string | null;
  thumb_url?: string | null;
  arte_mestra_url?: string | null;
  processo?: ProcessoDecoracaoOrcamento | null;
  conjunto_campos?: {
    id: string;
    nome: string;
    campos: CampoVariavelDefOrcamento[];
  } | null;
};

export type GradeAtributoDef = {
  chave: string;
  label: string;
  opcoes: string[];
};

export type CatalogoRegrasOrcamento = {
  personalizavel: boolean;
  fulfillment_padrao?: string | null;
  modos_habilitados: Array<'ESTAMPA' | 'IMPRINT_LIVRE' | 'ARTE_SOB_MEDIDA' | string>;
  estampas_permitidas: EstampaOrcamento[];
  processos_livres_permitidos: ProcessoDecoracaoOrcamento[];
  grade_atributos_def?: GradeAtributoDef[];
};

export type GradeDistribuicaoLinha = {
  atributos: Record<string, string>;
  quantidade: number;
};

export type PersonalizacaoVdpModo = 'INLINE' | 'PLANILHA';

export const MAX_CSV_VDP_ROWS = 500;
