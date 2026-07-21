/**
 * Testes leves das regras de transição (fonte: compras-estados.maps.js).
 * Rodar: node --test scripts/compras-estados-policy.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const maps = require(
  path.join(
    __dirname,
    '..',
    'src',
    'compras',
    'policies',
    'compras-estados.maps.js',
  ),
);

const {
  SOLICITACAO_TRANSICOES,
  SOLICITACAO_STATUS_ALVO,
  PEDIDO_TRANSICOES,
  PEDIDO_STATUS_ALVO,
} = maps;

function assertPermitido(mapa, acao, status) {
  assert.ok(
    mapa[acao]?.includes(status),
    `esperado permitir ${acao} a partir de ${status}`,
  );
}

function assertNegado(mapa, acao, status) {
  assert.ok(
    !mapa[acao]?.includes(status),
    `esperado negar ${acao} a partir de ${status}`,
  );
}

test('solicitacao: enviar RASCUNHO|DEVOLVIDA -> SOLICITADA', () => {
  assertPermitido(SOLICITACAO_TRANSICOES, 'enviar', 'RASCUNHO');
  assertPermitido(SOLICITACAO_TRANSICOES, 'enviar', 'DEVOLVIDA');
  assertNegado(SOLICITACAO_TRANSICOES, 'enviar', 'SOLICITADA');
  assert.equal(SOLICITACAO_STATUS_ALVO.enviar, 'SOLICITADA');
});

test('solicitacao: aprovar/rejeitar/devolver só de SOLICITADA', () => {
  for (const acao of ['aprovar', 'rejeitar', 'devolver']) {
    assertPermitido(SOLICITACAO_TRANSICOES, acao, 'SOLICITADA');
    assertNegado(SOLICITACAO_TRANSICOES, acao, 'RASCUNHO');
    assertNegado(SOLICITACAO_TRANSICOES, acao, 'APROVADA');
  }
  assert.equal(SOLICITACAO_STATUS_ALVO.aprovar, 'APROVADA');
  assert.equal(SOLICITACAO_STATUS_ALVO.rejeitar, 'REJEITADA');
  assert.equal(SOLICITACAO_STATUS_ALVO.devolver, 'DEVOLVIDA');
});

test('solicitacao: cancelar de RASCUNHO|SOLICITADA|APROVADA|DEVOLVIDA', () => {
  for (const status of [
    'RASCUNHO',
    'SOLICITADA',
    'APROVADA',
    'DEVOLVIDA',
  ]) {
    assertPermitido(SOLICITACAO_TRANSICOES, 'cancelar', status);
  }
  assertNegado(SOLICITACAO_TRANSICOES, 'cancelar', 'REJEITADA');
  assertNegado(SOLICITACAO_TRANSICOES, 'cancelar', 'CANCELADA');
  assert.equal(SOLICITACAO_STATUS_ALVO.cancelar, 'CANCELADA');
});

test('pedido: enviarAprovacao RASCUNHO -> EM_APROVACAO', () => {
  assertPermitido(PEDIDO_TRANSICOES, 'enviarAprovacao', 'RASCUNHO');
  assertNegado(PEDIDO_TRANSICOES, 'enviarAprovacao', 'EM_APROVACAO');
  assert.equal(PEDIDO_STATUS_ALVO.enviarAprovacao, 'EM_APROVACAO');
});

test('pedido: aprovar de RASCUNHO|EM_APROVACAO', () => {
  assertPermitido(PEDIDO_TRANSICOES, 'aprovar', 'RASCUNHO');
  assertPermitido(PEDIDO_TRANSICOES, 'aprovar', 'EM_APROVACAO');
  assertNegado(PEDIDO_TRANSICOES, 'aprovar', 'APROVADO');
  assert.equal(PEDIDO_STATUS_ALVO.aprovar, 'APROVADO');
});

test('pedido: rejeitar só EM_APROVACAO -> REJEITADO', () => {
  assertPermitido(PEDIDO_TRANSICOES, 'rejeitar', 'EM_APROVACAO');
  assertNegado(PEDIDO_TRANSICOES, 'rejeitar', 'RASCUNHO');
  assert.equal(PEDIDO_STATUS_ALVO.rejeitar, 'REJEITADO');
});

test('pedido: enviarFornecedor APROVADO -> ENVIADO', () => {
  assertPermitido(PEDIDO_TRANSICOES, 'enviarFornecedor', 'APROVADO');
  assertNegado(PEDIDO_TRANSICOES, 'enviarFornecedor', 'RASCUNHO');
  assert.equal(PEDIDO_STATUS_ALVO.enviarFornecedor, 'ENVIADO');
});

test('pedido: cancelar de estados intermediários (não ATENDIDO/CONCLUIDO)', () => {
  for (const status of [
    'RASCUNHO',
    'EM_APROVACAO',
    'APROVADO',
    'ENVIADO',
    'PARCIAL',
  ]) {
    assertPermitido(PEDIDO_TRANSICOES, 'cancelar', status);
  }
  assertNegado(PEDIDO_TRANSICOES, 'cancelar', 'ATENDIDO');
  assertNegado(PEDIDO_TRANSICOES, 'cancelar', 'CONCLUIDO');
  assertNegado(PEDIDO_TRANSICOES, 'cancelar', 'CANCELADO');
  assert.equal(PEDIDO_STATUS_ALVO.cancelar, 'CANCELADO');
});

test('pedido: substituivel APROVADO|ENVIADO|PARCIAL', () => {
  for (const status of ['APROVADO', 'ENVIADO', 'PARCIAL']) {
    assertPermitido(PEDIDO_TRANSICOES, 'substituivel', status);
  }
  assertNegado(PEDIDO_TRANSICOES, 'substituivel', 'RASCUNHO');
  assertNegado(PEDIDO_TRANSICOES, 'substituivel', 'CANCELADO');
});
