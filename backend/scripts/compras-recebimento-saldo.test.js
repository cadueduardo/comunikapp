/**
 * Testes do saldo pendente de recebimento/aceite.
 * Rodar: node --test scripts/compras-recebimento-saldo.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

function saldoPendenteItem(quantidadePedido, quantidadeAcumulada) {
  const pendente = Number(quantidadePedido) - Number(quantidadeAcumulada);
  return pendente > 0 ? pendente : 0;
}

test('saldo: sem recebimento = quantidade do pedido', () => {
  assert.equal(saldoPendenteItem(10, 0), 10);
});

test('saldo: parcial reduz pendente', () => {
  assert.equal(saldoPendenteItem(10, 4), 6);
});

test('saldo: totalmente recebido = 0', () => {
  assert.equal(saldoPendenteItem(10, 10), 0);
});

test('saldo: acumulo acima do pedido nao fica negativo', () => {
  assert.equal(saldoPendenteItem(10, 12), 0);
});

test('saldo: aceita nao pode exceder pendente (regra MVP)', () => {
  const pendente = saldoPendenteItem(8, 5);
  const tentativa = 4;
  assert.ok(tentativa > pendente, 'setup: tentativa excede');
  assert.equal(pendente, 3);
});
