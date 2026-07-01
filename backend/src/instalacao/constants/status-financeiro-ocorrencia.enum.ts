/**
 * Espelha `StatusFinanceiroOcorrencia` do Prisma (split financeiro / OS Aditiva).
 */
export enum StatusFinanceiroOcorrenciaValor {
  PENDENTE_PRECIFICACAO = 'PENDENTE_PRECIFICACAO',
  PRECIFICADO = 'PRECIFICADO',
  FATURADO = 'FATURADO',
  ABONADO = 'ABONADO',
  CANCELADO = 'CANCELADO',
}

export const TIPO_VINCULO_OS_ADITIVA = 'ADITIVA_INSTALACAO';

export const ORIGEM_OS_ADITIVA_INSTALACAO = 'ADITIVA_INSTALACAO';
