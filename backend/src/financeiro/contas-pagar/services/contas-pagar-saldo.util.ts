/** Arredonda dinheiro em 2 casas (centavos). */
export function roundMoney2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Saldo em aberto da conta/parcela. Nunca negativo. */
export function saldoAberto(valorTotal: number, valorPago: number): number {
  const saldo = roundMoney2(Number(valorTotal) - Number(valorPago));
  return saldo > 0 ? saldo : 0;
}

export type StatusContaRollup =
  | 'PREVISTA'
  | 'ABERTA'
  | 'PARCIAL_PAGO'
  | 'PAGA'
  | 'VENCIDA'
  | 'CANCELADA';

export type StatusParcelaRollup =
  | 'PREVISTO'
  | 'PARCIAL_PAGO'
  | 'PAGO'
  | 'VENCIDO'
  | 'CANCELADA';

/**
 * Recalcula status da conta a partir do saldo e vencimento.
 * CANCELADA é preservada; não recalcula para conta cancelada.
 */
export function statusContaRollup(params: {
  valorTotal: number;
  valorPago: number;
  statusAtual: StatusContaRollup;
  temParcelaVencidaNaoPaga?: boolean;
}): StatusContaRollup {
  if (params.statusAtual === 'CANCELADA') {
    return 'CANCELADA';
  }

  const total = roundMoney2(Number(params.valorTotal));
  const pago = roundMoney2(Number(params.valorPago));

  if (pago <= 0) {
    if (params.temParcelaVencidaNaoPaga) {
      return 'VENCIDA';
    }
    if (params.statusAtual === 'PREVISTA') {
      return 'PREVISTA';
    }
    return 'ABERTA';
  }

  if (pago >= total) {
    return 'PAGA';
  }

  return 'PARCIAL_PAGO';
}

/**
 * Recalcula status da parcela a partir do saldo e vencimento.
 */
export function statusParcelaRollup(params: {
  valorPrevisto: number;
  valorPago: number;
  statusAtual: StatusParcelaRollup;
  vencida?: boolean;
}): StatusParcelaRollup {
  if (params.statusAtual === 'CANCELADA') {
    return 'CANCELADA';
  }

  const previsto = roundMoney2(Number(params.valorPrevisto));
  const pago = roundMoney2(Number(params.valorPago));

  if (pago <= 0) {
    if (params.vencida) {
      return 'VENCIDO';
    }
    return 'PREVISTO';
  }

  if (pago >= previsto) {
    return 'PAGO';
  }

  return 'PARCIAL_PAGO';
}
