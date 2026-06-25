/**
 * Utilitários de tempo em UTC para filtros operacionais (ex.: janela 24h do PCP).
 * Evita divergência quando o processo Node roda com TZ local (ex.: America/Sao_Paulo).
 */
export function obterInstanteUtcAgora(): Date {
  return new Date();
}

/**
 * Retorna o limiar UTC: instante atual menos `horas` (padrão 24h do Kanban PCP).
 */
export function obterLimiarHorasAtrasUtc(horas: number): Date {
  const ms = horas * 60 * 60 * 1000;
  return new Date(Date.now() - ms);
}

/**
 * Compara se `dataReferencia` é igual ou posterior ao limiar (ambos como instantes UTC).
 */
export function estaDentroDaJanelaUtc(
  dataReferencia: Date | null | undefined,
  limiarUtc: Date,
): boolean {
  if (!dataReferencia) {
    return false;
  }
  return dataReferencia.getTime() >= limiarUtc.getTime();
}
