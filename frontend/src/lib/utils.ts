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
    const rawValue = String(value).replace(/\D/g, '');
    if (rawValue === '') {
      return '';
    }
    numberValue = parseFloat(rawValue) / 100;
  }
  
  if (isInitialValue && typeof value === 'string') {
    numberValue = parseFloat(value);
  }

  if (isNaN(numberValue)) {
    return '';
  }

  // Formata o número para o padrão de moeda ou decimal brasileiro
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'decimal', // Usar decimal para ter mais controle
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const formattedValue = formatter.format(numberValue);

  if (withSymbol) {
    return `R$ ${formattedValue}`;
  }
  
  return `${formattedValue} %`;
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
