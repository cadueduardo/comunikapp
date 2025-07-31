import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: string | number | null | undefined, 
  withSymbol = true,
  isInitialValue = false
): string {
  if (value === null || value === undefined) {
    return '';
  }

  let numberValue: number;

  if (typeof value === 'number') {
    numberValue = value; 
  } else {
    // Se for string, tentar converter diretamente para número
    const stringValue = String(value).trim();
    if (stringValue === '') {
      return '';
    }
    
    // Se for um valor em centavos (string numérica), converter para reais
    if (/^\d+$/.test(stringValue)) {
      numberValue = parseFloat(stringValue) / 100;
    } else {
      // Se já for um valor em reais (com vírgula ou ponto), converter diretamente
      const cleanedValue = stringValue.replace(/[^\d,.-]/g, '').replace(',', '.');
      numberValue = parseFloat(cleanedValue);
    }
  }
  
  if (isInitialValue && typeof value === 'string') {
    numberValue = parseFloat(value);
  }

  if (isNaN(numberValue)) {
    return '';
  }

  // Formata o número para o padrão de moeda brasileiro
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(numberValue);
}

export function parseCurrency(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return NaN;
  }
  if (typeof value === 'number') {
    return value;
  }
  
  const cleanedValue = String(value)
    .replace(/\s/g, '') // Remove todos os espaços
    .replace('R$', '')
    .replace('%', '')
    .replace(/\./g, '')
    .replace(',', '.');
    
  return parseFloat(cleanedValue);
}
