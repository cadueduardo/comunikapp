/**
 * Tipos de condicao de pagamento suportados pelo financeiro minimo (Fase 6).
 *
 * Decisao do produto (2026-05-25): suporte completo a 7 tipos para cobrir
 * tanto cenarios B2C (a vista, entrada/saldo) quanto B2B (faturado N dias,
 * parcelado) e casos especiais (personalizado).
 */
export enum CondicaoPagamentoTipo {
  /** Pagamento a vista, totalmente no momento da aprovacao. */
  A_VISTA = 'A_VISTA',
  /** Entrada + saldo (50/50, 30/70, etc). Padrao para a maior parte dos clientes. */
  ENTRADA_SALDO = 'ENTRADA_SALDO',
  /** Faturado 30 dias apos aprovacao. */
  FATURADO_30 = 'FATURADO_30',
  /** Faturado 60 dias apos aprovacao. */
  FATURADO_60 = 'FATURADO_60',
  /** Faturado 90 dias apos aprovacao. */
  FATURADO_90 = 'FATURADO_90',
  /** Parcelado em N parcelas mensais iguais. */
  PARCELADO = 'PARCELADO',
  /** Definido manualmente pelo usuario (parcelas customizadas). */
  PERSONALIZADO = 'PERSONALIZADO',
}

export const CONDICAO_PAGAMENTO_VALORES = Object.values(CondicaoPagamentoTipo);

/**
 * Conjunto dos tipos que tem `data_vencimento` calculada deterministicamente
 * a partir da data de aprovacao + offset fixo. Os tipos PARCELADO e
 * PERSONALIZADO permitem o usuario informar as datas manualmente.
 */
export const TIPOS_VENCIMENTO_AUTOMATICO = new Set<string>([
  CondicaoPagamentoTipo.A_VISTA,
  CondicaoPagamentoTipo.ENTRADA_SALDO,
  CondicaoPagamentoTipo.FATURADO_30,
  CondicaoPagamentoTipo.FATURADO_60,
  CondicaoPagamentoTipo.FATURADO_90,
]);
