/**
 * Fonte única das transições de status de Compras (solicitação / pedido).
 * Consumida por compras-estados.policy.ts e por scripts/compras-estados-policy.test.js.
 */

'use strict';

/** @type {Record<string, string[]>} */
const SOLICITACAO_TRANSICOES = {
  enviar: ['RASCUNHO', 'DEVOLVIDA'],
  aprovar: ['SOLICITADA'],
  rejeitar: ['SOLICITADA'],
  devolver: ['SOLICITADA'],
  cancelar: ['RASCUNHO', 'SOLICITADA', 'APROVADA', 'DEVOLVIDA'],
};

/** @type {Record<string, string>} */
const SOLICITACAO_STATUS_ALVO = {
  enviar: 'SOLICITADA',
  aprovar: 'APROVADA',
  rejeitar: 'REJEITADA',
  devolver: 'DEVOLVIDA',
  cancelar: 'CANCELADA',
};

/** @type {Record<string, string[]>} */
const PEDIDO_TRANSICOES = {
  enviarAprovacao: ['RASCUNHO'],
  aprovar: ['RASCUNHO', 'EM_APROVACAO'],
  rejeitar: ['EM_APROVACAO'],
  enviarFornecedor: ['APROVADO'],
  cancelar: ['RASCUNHO', 'EM_APROVACAO', 'APROVADO', 'ENVIADO', 'PARCIAL'],
  /** Status em que o pedido pode ser substituído (não é transição de status). */
  substituivel: ['APROVADO', 'ENVIADO', 'PARCIAL'],
};

/** @type {Record<string, string>} */
const PEDIDO_STATUS_ALVO = {
  enviarAprovacao: 'EM_APROVACAO',
  aprovar: 'APROVADO',
  rejeitar: 'REJEITADO',
  enviarFornecedor: 'ENVIADO',
  cancelar: 'CANCELADO',
};

module.exports = {
  SOLICITACAO_TRANSICOES,
  SOLICITACAO_STATUS_ALVO,
  PEDIDO_TRANSICOES,
  PEDIDO_STATUS_ALVO,
};
