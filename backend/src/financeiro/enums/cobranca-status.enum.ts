/**
 * Status oficiais de cobranca (Fase 0 - doc 01-status-oficiais.md secao 3).
 *
 * Diferenca em relacao ao plano original: como a Fase 6 introduziu PARCELADO
 * (N parcelas), o status detalhado de cada parcela vive em `CobrancaParcela.status`
 * e o status da cobranca pai e um ROLLUP calculado por `StatusRollupService`.
 *
 * Regras de rollup:
 * - todas as parcelas LIQUIDADO        -> cobranca LIQUIDADO
 * - alguma parcela VENCIDO             -> cobranca VENCIDO (precedencia alta)
 * - alguma LIQUIDADO ou PARCIAL_PAGO   -> cobranca PARCIAL_PAGO
 * - todas as parcelas CANCELADA        -> cobranca CANCELADA
 * - caso contrario                     -> cobranca PREVISTA
 */
export enum CobrancaStatus {
  PREVISTA = 'PREVISTA',
  PARCIAL_PAGO = 'PARCIAL_PAGO',
  LIQUIDADO = 'LIQUIDADO',
  VENCIDO = 'VENCIDO',
  CANCELADA = 'CANCELADA',
}

export const COBRANCA_STATUS_VALORES = Object.values(CobrancaStatus);

/** Status terminais nao mudam, exceto via acoes administrativas. */
export const COBRANCA_STATUS_TERMINAIS = new Set<string>([
  CobrancaStatus.LIQUIDADO,
  CobrancaStatus.CANCELADA,
]);

/**
 * Status de uma parcela individual. PARCIAL_PAGO existe porque
 * o usuario pode registrar varios recebimentos pequenos antes de liquidar.
 */
export enum ParcelaStatus {
  PREVISTO = 'PREVISTO',
  PARCIAL_PAGO = 'PARCIAL_PAGO',
  LIQUIDADO = 'LIQUIDADO',
  VENCIDO = 'VENCIDO',
  CANCELADA = 'CANCELADA',
}

export const PARCELA_STATUS_TERMINAIS = new Set<string>([
  ParcelaStatus.LIQUIDADO,
  ParcelaStatus.CANCELADA,
]);

/** Tipos de parcela suportados no schema. */
export enum ParcelaTipo {
  ENTRADA = 'ENTRADA',
  SALDO = 'SALDO',
  PARCELA = 'PARCELA',
}

/** Metodos de recebimento aceitos. Coincide com a coluna VARCHAR(16) do schema. */
export enum RecebimentoMetodo {
  PIX = 'PIX',
  TRANSFERENCIA = 'TRANSFERENCIA',
  BOLETO = 'BOLETO',
  DINHEIRO = 'DINHEIRO',
  CARTAO = 'CARTAO',
  OUTRO = 'OUTRO',
}

export const RECEBIMENTO_METODOS = Object.values(RecebimentoMetodo);

/** Tipos de acao gravados em `cobranca_logs`. */
export enum CobrancaLogAcao {
  COBRANCA_CRIADA = 'COBRANCA_CRIADA',
  RECEBIMENTO_REGISTRADO = 'RECEBIMENTO_REGISTRADO',
  PARCIAL_PAGO = 'PARCIAL_PAGO',
  LIQUIDADA = 'LIQUIDADA',
  MARCADA_VENCIDA = 'MARCADA_VENCIDA',
  CANCELADA = 'CANCELADA',
  FORCADA_LIQUIDACAO = 'FORCADA_LIQUIDACAO',
  EDITADA = 'EDITADA',
}
