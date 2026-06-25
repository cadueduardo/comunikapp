/**
 * Formatação monetária pt-BR (Real) para inputs e exibição.
 */

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Valor decimal para campo de digitação (ex.: 203,43). */
export function formatarValorInput(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte texto digitado em número.
 * Aceita "203,43", "1.234,56" e também "203.43" (ponto como decimal, comum em mobile).
 */
export function parseValorMoedaBr(valor: string): number {
  const bruto = valor.trim().replace(/R\$\s?/gi, '').replace(/\s/g, '');
  if (!bruto) return NaN;

  if (bruto.includes(',')) {
    const normalizado = bruto.replace(/\./g, '').replace(',', '.');
    return Number(normalizado);
  }

  return Number(bruto);
}
