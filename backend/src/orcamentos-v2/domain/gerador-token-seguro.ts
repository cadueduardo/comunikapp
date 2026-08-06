import { randomBytes, randomInt } from 'crypto';

/**
 * Gerador de Tokens e Códigos de Aprovação com Segurança Criptográfica (CSPRNG).
 *
 * Elimina o uso de `Math.random()` conforme orientações OWASP e
 * `docs/database/boas-praticas-schema-prisma.md` §Segurança.
 */

/**
 * Gera um token hexadecimal aleatório seguro de 32 bytes (64 caracteres).
 */
export function gerarTokenSeguroCsprng(tamanhoBytes: number = 32): string {
  return randomBytes(tamanhoBytes).toString('hex');
}

/**
 * Gera um código numérico de aprovação seguro com a quantidade de dígitos desejada (default 6).
 */
export function gerarCodigoAprovacaoNumerico(tamanhoDigitos: number = 6): string {
  const min = Math.pow(10, tamanhoDigitos - 1);
  const max = Math.pow(10, tamanhoDigitos) - 1;
  return randomInt(min, max + 1).toString();
}
