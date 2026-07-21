/**
 * Testes de saldo e rollup de status de Conta a Pagar.
 * Rodar: node --test scripts/compras-conta-pagar-saldo.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

function roundMoney2(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function saldoAberto(valorTotal, valorPago) {
  const saldo = roundMoney2(Number(valorTotal) - Number(valorPago));
  return saldo > 0 ? saldo : 0;
}

function statusContaRollup({
  valorTotal,
  valorPago,
  statusAtual,
  temParcelaVencidaNaoPaga,
}) {
  if (statusAtual === 'CANCELADA') {
    return 'CANCELADA';
  }
  const total = roundMoney2(Number(valorTotal));
  const pago = roundMoney2(Number(valorPago));
  if (pago <= 0) {
    if (temParcelaVencidaNaoPaga) {
      return 'VENCIDA';
    }
    if (statusAtual === 'PREVISTA') {
      return 'PREVISTA';
    }
    return 'ABERTA';
  }
  if (pago >= total) {
    return 'PAGA';
  }
  return 'PARCIAL_PAGO';
}

function statusParcelaRollup({
  valorPrevisto,
  valorPago,
  statusAtual,
  vencida,
}) {
  if (statusAtual === 'CANCELADA') {
    return 'CANCELADA';
  }
  const previsto = roundMoney2(Number(valorPrevisto));
  const pago = roundMoney2(Number(valorPago));
  if (pago <= 0) {
    if (vencida) {
      return 'VENCIDO';
    }
    return 'PREVISTO';
  }
  if (pago >= previsto) {
    return 'PAGO';
  }
  return 'PARCIAL_PAGO';
}

test('saldo: conta sem pagamento = total', () => {
  assert.equal(saldoAberto(100, 0), 100);
});

test('saldo: pagamento parcial reduz aberto', () => {
  assert.equal(saldoAberto(100, 40), 60);
});

test('saldo: quitado = 0', () => {
  assert.equal(saldoAberto(100, 100), 0);
});

test('saldo: pago acima do total nao fica negativo', () => {
  assert.equal(saldoAberto(100, 120), 0);
});

test('saldo: arredonda centavos', () => {
  assert.equal(saldoAberto(10.1, 0.05), 10.05);
});

test('status conta: sem pagamento permanece ABERTA', () => {
  assert.equal(
    statusContaRollup({
      valorTotal: 100,
      valorPago: 0,
      statusAtual: 'ABERTA',
    }),
    'ABERTA',
  );
});

test('status conta: parcial', () => {
  assert.equal(
    statusContaRollup({
      valorTotal: 100,
      valorPago: 30,
      statusAtual: 'ABERTA',
    }),
    'PARCIAL_PAGO',
  );
});

test('status conta: paga', () => {
  assert.equal(
    statusContaRollup({
      valorTotal: 100,
      valorPago: 100,
      statusAtual: 'PARCIAL_PAGO',
    }),
    'PAGA',
  );
});

test('status conta: vencida sem pagamento', () => {
  assert.equal(
    statusContaRollup({
      valorTotal: 100,
      valorPago: 0,
      statusAtual: 'ABERTA',
      temParcelaVencidaNaoPaga: true,
    }),
    'VENCIDA',
  );
});

test('status conta: cancelada preservada', () => {
  assert.equal(
    statusContaRollup({
      valorTotal: 100,
      valorPago: 0,
      statusAtual: 'CANCELADA',
    }),
    'CANCELADA',
  );
});

test('status parcela: parcial e pago', () => {
  assert.equal(
    statusParcelaRollup({
      valorPrevisto: 50,
      valorPago: 20,
      statusAtual: 'PREVISTO',
    }),
    'PARCIAL_PAGO',
  );
  assert.equal(
    statusParcelaRollup({
      valorPrevisto: 50,
      valorPago: 50,
      statusAtual: 'PARCIAL_PAGO',
    }),
    'PAGO',
  );
});

test('status parcela: vencido sem pagamento', () => {
  assert.equal(
    statusParcelaRollup({
      valorPrevisto: 50,
      valorPago: 0,
      statusAtual: 'PREVISTO',
      vencida: true,
    }),
    'VENCIDO',
  );
});
