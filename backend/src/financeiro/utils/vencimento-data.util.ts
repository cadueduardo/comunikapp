/** Fuso usado para vencimento de parcelas (dia civil comercial). */
export const FUSO_FINANCEIRO = 'America/Sao_Paulo';

/** Retorna YYYY-MM-DD no fuso informado. */
export function chaveDiaCalendario(
  data: Date,
  timeZone = FUSO_FINANCEIRO,
): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(data);
}

/**
 * Vencido somente após o dia do vencimento (não no próprio dia).
 * Evita marcar como vencida parcela com vencimento "hoje" por causa de hora UTC.
 */
export function dataVencimentoJaPassou(
  dataVencimento: Date,
  agora: Date = new Date(),
): boolean {
  return (
    chaveDiaCalendario(dataVencimento) < chaveDiaCalendario(agora)
  );
}
