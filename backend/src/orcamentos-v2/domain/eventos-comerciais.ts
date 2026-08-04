/**
 * Eventos comerciais canônicos (Fase 1 / M1.4).
 * Fonte: docs/modulo-vendas/fase-0/03-nomenclatura-e-matriz-rbac.md §6.
 */

export const EVENTOS_COMERCIAIS = {
  PROPOSTA_CRIADA: 'vendas.proposta.criada',
  PROPOSTA_ENVIADA: 'vendas.proposta.enviada',
  PROPOSTA_VISUALIZADA: 'vendas.proposta.visualizada',
  PROPOSTA_REVISAO_SOLICITADA: 'vendas.proposta.revisao_solicitada',
  PROPOSTA_REVISADA: 'vendas.proposta.revisada',
  PROPOSTA_EXPIRADA: 'vendas.proposta.expirada',
  PROPOSTA_PERDIDA: 'vendas.proposta.perdida',
  PROPOSTA_REABERTA: 'vendas.proposta.reaberta',
  PROPOSTA_ACEITA: 'vendas.proposta.aceita',
  PEDIDO_CONFIRMADO: 'vendas.pedido.confirmado',
  PEDIDO_CANCELADO: 'vendas.pedido.cancelado',
  ALCADA_SOLICITADA: 'vendas.alcada.solicitada',
  ALCADA_DECIDIDA: 'vendas.alcada.decidida',
  CARTEIRA_TRANSFERIDA: 'vendas.carteira.transferida',
  ADITIVO_PRECIFICADO: 'vendas.aditivo.precificado',
  ADITIVO_ACEITO: 'vendas.aditivo.aceito',
} as const;

export type EventoComercial =
  (typeof EVENTOS_COMERCIAIS)[keyof typeof EVENTOS_COMERCIAIS];

export function isEventoComercial(valor: string): valor is EventoComercial {
  return (Object.values(EVENTOS_COMERCIAIS) as string[]).includes(valor);
}
