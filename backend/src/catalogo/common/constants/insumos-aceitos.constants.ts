export const INSUMOS_ACEITOS_VALORES = [
  'ARQUIVO',
  'TEXTO',
  'VETOR',
] as const;

export type InsumoAceitoValor = (typeof INSUMOS_ACEITOS_VALORES)[number];
