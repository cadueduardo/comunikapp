/**
 * Converte YYYY-MM-DD em Date estável para agenda (meio-dia UTC),
 * evitando deslocamento de dia no fuso America/Sao_Paulo.
 */
export function parseDataPrevisaoCampo(valor: string): Date {
  const trimmed = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const data = new Date(`${trimmed}T12:00:00.000Z`);
    if (Number.isNaN(data.getTime())) {
      throw new Error('Data de previsão inválida.');
    }
    return data;
  }

  const data = new Date(trimmed);
  if (Number.isNaN(data.getTime())) {
    throw new Error('Data de previsão inválida.');
  }
  return data;
}

const FUSO_AGENDA = 'America/Sao_Paulo';

/** Dia civil de data_previsao — alinhado ao frontend (`chaveDiaPrevisaoAgenda`). */
export function chaveDiaPrevisaoAgenda(valor: string | Date): string {
  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    const dateOnly = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnly) {
      const normalizada = new Date(`${dateOnly[1]}T12:00:00.000Z`);
      return normalizada.toLocaleDateString('en-CA', { timeZone: FUSO_AGENDA });
    }
  }
  const data = typeof valor === 'string' ? new Date(valor) : valor;
  return data.toLocaleDateString('en-CA', { timeZone: FUSO_AGENDA });
}
