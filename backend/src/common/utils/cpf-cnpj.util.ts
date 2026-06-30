const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

export function stripDocument(value: string): string {
  return value.replace(/\D/g, '');
}

function hasRepeatedDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function calculateCpfCheckDigit(digits: string, factorStart: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * (factorStart - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function calculateCnpjCheckDigit(digits: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) {
    sum += Number(digits[i]) * weights[i];
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(value: string): boolean {
  const digits = stripDocument(value);
  if (digits.length !== CPF_LENGTH || hasRepeatedDigits(digits)) {
    return false;
  }

  const base = digits.slice(0, 9);
  const firstDigit = calculateCpfCheckDigit(base, 10);
  const secondDigit = calculateCpfCheckDigit(`${base}${firstDigit}`, 11);

  return digits === `${base}${firstDigit}${secondDigit}`;
}

export function isValidCnpj(value: string): boolean {
  const digits = stripDocument(value);
  if (digits.length !== CNPJ_LENGTH || hasRepeatedDigits(digits)) {
    return false;
  }

  const base = digits.slice(0, 12);
  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const firstDigit = calculateCnpjCheckDigit(base, firstWeights);
  const secondDigit = calculateCnpjCheckDigit(
    `${base}${firstDigit}`,
    secondWeights,
  );

  return digits === `${base}${firstDigit}${secondDigit}`;
}

export function normalizeCpf(value: string): string {
  return stripDocument(value);
}

export function normalizeCnpj(value: string): string {
  return stripDocument(value);
}

export function formatCpf(value: string): string {
  const digits = stripDocument(value);
  if (digits.length !== CPF_LENGTH) return value.trim();
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatCnpj(value: string): string {
  const digits = stripDocument(value);
  if (digits.length !== CNPJ_LENGTH) return value.trim();
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5',
  );
}
