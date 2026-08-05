/**
 * Timezone canônico do domínio Vendas (Fase 5).
 * Fonte única: America/Sao_Paulo. process.env.TZ deve alinhar-se a esta
 * constante no boot — nunca o inverso.
 */
export const VENDAS_TIMEZONE = 'America/Sao_Paulo' as const;

export type VendasTimezone = typeof VENDAS_TIMEZONE;

export function assertVendasTimezoneBoot(): void {
  const atual = process.env.TZ;
  if (atual && atual !== VENDAS_TIMEZONE) {
    // Alinha ao canônico; documentado no plano Fase 5 §8.
    process.env.TZ = VENDAS_TIMEZONE;
  } else if (!atual) {
    process.env.TZ = VENDAS_TIMEZONE;
  }
}

/** Início/fim do dia operacional em UTC a partir do calendário America/Sao_Paulo. */
export function limitesDiaOperacional(
  referencia: Date = new Date(),
  timezone: VendasTimezone = VENDAS_TIMEZONE,
): { inicioUtc: Date; fimUtc: Date; dataOperacional: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dataOperacional = fmt.format(referencia); // YYYY-MM-DD
  // Offset SP: -03:00 (sem DST desde 2019). Limites locais → UTC.
  const inicioUtc = new Date(`${dataOperacional}T00:00:00.000-03:00`);
  const fimUtc = new Date(`${dataOperacional}T23:59:59.999-03:00`);
  return { inicioUtc, fimUtc, dataOperacional };
}

export function dataOperacionalMaisDias(
  dataOperacionalYYYYMMDD: string,
  dias: number,
): string {
  const base = new Date(`${dataOperacionalYYYYMMDD}T12:00:00.000-03:00`);
  base.setUTCDate(base.getUTCDate() + dias);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: VENDAS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(base);
}
