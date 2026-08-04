/**
 * Validade estruturada da proposta (DV-07 / M1.3).
 * `validade_proposta` textual permanece só para compatibilidade de leitura.
 */

const PADRAO_DIAS = /^(\d+)\s*dias?$/i;
const DEFAULT_VALIDADE_DIAS = 30;

export function parsearValidadeDias(
  validadeProposta: string | null | undefined,
  fallback = DEFAULT_VALIDADE_DIAS,
): number {
  if (!validadeProposta?.trim()) {
    return fallback;
  }
  const match = validadeProposta.trim().match(PADRAO_DIAS);
  if (!match) {
    return fallback;
  }
  const dias = Number(match[1]);
  return Number.isFinite(dias) && dias > 0 ? dias : fallback;
}

/** Calcula `expira_em` a partir do instante de envio e da validade em dias. */
export function calcularExpiraEm(
  enviadoEm: Date,
  validadeDias: number,
): Date {
  const expira = new Date(enviadoEm.getTime());
  expira.setUTCDate(expira.getUTCDate() + validadeDias);
  return expira;
}

export function montarCamposValidadeNoEnvio(entrada: {
  validadeProposta?: string | null;
  validadeDias?: number | null;
  enviadoEm?: Date;
}): {
  validade_dias: number;
  expira_em: Date;
} {
  const enviadoEm = entrada.enviadoEm ?? new Date();
  const validade_dias =
    entrada.validadeDias && entrada.validadeDias > 0
      ? entrada.validadeDias
      : parsearValidadeDias(entrada.validadeProposta);
  return {
    validade_dias,
    expira_em: calcularExpiraEm(enviadoEm, validade_dias),
  };
}
