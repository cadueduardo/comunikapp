export enum MetodoCobrancaChapa {
  AREA_LIQUIDA = 'AREA_LIQUIDA',
  AREA_COM_PERDA = 'AREA_COM_PERDA',
  CHAPA_INTEIRA = 'CHAPA_INTEIRA',
  MANUAL = 'MANUAL',
}

export type UnidadeDimensaoChapa = 'mm' | 'cm' | 'm';

export interface SimularChapaInput {
  insumoId?: string;
  larguraPeca: number;
  alturaPeca: number;
  quantidade: number;
  larguraChapa: number;
  alturaChapa: number;
  perdaPercent?: number;
  metodoCobranca: MetodoCobrancaChapa;
  /** @deprecated Preferir unidadeDimensaoPeca + unidadeDimensaoChapa */
  unidadeDimensao?: UnidadeDimensaoChapa | string;
  /** Unidade das medidas da peça (ex.: cm no produto do orçamento). */
  unidadeDimensaoPeca?: UnidadeDimensaoChapa | string;
  /** Unidade das medidas da mídia/rolo/chapa (cadastro do insumo, padrão m). */
  unidadeDimensaoChapa?: UnidadeDimensaoChapa | string;
  custoM2?: number;
  areaManual?: number;
  valorManual?: number;
}

export interface ResultadoCalculoChapa {
  insumo_id?: string;
  unidade_dimensao: UnidadeDimensaoChapa;
  metodo_cobranca: MetodoCobrancaChapa;
  peca_cabe_na_chapa: boolean;
  area_chapa_m2: number;
  area_pecas_m2: number;
  area_com_perda_m2: number;
  chapas_necessarias: number;
  area_considerada_custo_m2: number;
  sobra_area_m2: number;
  aproveitamento_percent: number;
  sobra_percent: number;
  custo_m2: number;
  custo_material: number;
  sugestao_cobranca: number;
  mensagens: string[];
  parametros: {
    largura_peca: number;
    altura_peca: number;
    quantidade: number;
    largura_chapa: number;
    altura_chapa: number;
    perda_percent: number;
  };
}
