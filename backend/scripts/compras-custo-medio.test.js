/**
 * Testes do custo médio ponderado D1 (entrada de compra).
 * Rodar: node --test scripts/compras-custo-medio.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

/**
 * novo = ((qtd * preco) + (entrada * preco_item)) / (qtd + entrada)
 */
function calcularCustoMedioPonderado(
  quantidadeAtual,
  precoAtual,
  quantidadeEntrada,
  precoEntrada,
) {
  const qtd = Number(quantidadeAtual) || 0;
  const preco = Number(precoAtual) || 0;
  const entrada = Number(quantidadeEntrada) || 0;
  const precoItem = Number(precoEntrada) || 0;

  if (entrada <= 0) {
    return preco;
  }

  const denominador = qtd + entrada;
  if (denominador <= 0) {
    return precoItem;
  }

  return (qtd * preco + entrada * precoItem) / denominador;
}

test('custo medio: estoque vazio recebe preco da entrada', () => {
  const novo = calcularCustoMedioPonderado(0, 0, 10, 5.5);
  assert.equal(novo, 5.5);
});

test('custo medio: pondera estoque existente com entrada', () => {
  // (10*2 + 10*4) / 20 = 3
  const novo = calcularCustoMedioPonderado(10, 2, 10, 4);
  assert.equal(novo, 3);
});

test('custo medio: entrada zero mantem preco atual', () => {
  const novo = calcularCustoMedioPonderado(5, 8, 0, 99);
  assert.equal(novo, 8);
});

test('custo medio: entrada parcial altera media', () => {
  // (100*10 + 50*20) / 150 = 13.333...
  const novo = calcularCustoMedioPonderado(100, 10, 50, 20);
  assert.ok(Math.abs(novo - 40 / 3) < 1e-9);
});
