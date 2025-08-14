import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: string | number | null | undefined, 
  _withSymbol = true,
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

export function formatLocalizacaoCompleta(localizacao: any): string {
  if (!localizacao) return '';
  
  // Se já temos a localização completa formatada
  if (localizacao.localizacaoCompleta) {
    return localizacao.localizacaoCompleta;
  }
  
  // Se temos os campos individuais
  const parts = [
    localizacao.localizacaoDeposito,
    localizacao.localizacaoCorredor,
    localizacao.localizacaoPrateleira,
    localizacao.localizacaoNivel,
    localizacao.localizacaoPosicao
  ].filter(Boolean);
  
  if (parts.length > 0) {
    return parts.join(' - ');
  }
  
  // Fallback para o código
  return localizacao.localizacaoCodigo || '';
}

export function formatLocalizacaoDisplay(localizacao: any): { deposito: string; detalhes: string } {
  if (!localizacao) return { deposito: '', detalhes: '' };
  
  // Se temos a localização completa formatada
  if (localizacao.localizacaoCompleta) {
    const parts = localizacao.localizacaoCompleta.split(' - ');
    const deposito = parts[0] || '';
    const detalhes = parts.slice(1).join(' - ') || '';
    return { deposito, detalhes };
  }
  
  // Se temos os campos individuais
  const deposito = localizacao.localizacaoDeposito || '';
  const detalhes = [
    localizacao.localizacaoCorredor,
    localizacao.localizacaoPrateleira,
    localizacao.localizacaoNivel,
    localizacao.localizacaoPosicao
  ].filter(Boolean).join(' - ');
  
  if (deposito && detalhes) {
    return { deposito, detalhes };
  }
  
  // Fallback para o código
  return { deposito: localizacao.localizacaoCodigo || '', detalhes: '' };
}
