/**
 * Testes de agregação do pós-cálculo (funções puras).
 * Rodar: node --test scripts/pos-calculo-aggregation.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

function roundMoney2(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function montarTotaisPosCalculo(entrada) {
  const receitaPrevista = roundMoney2(entrada.receitaPrevista);
  const receitaFaturada = roundMoney2(entrada.receitaFaturada);
  const receitaRecebida = roundMoney2(entrada.receitaRecebida);
  const previsto = roundMoney2(entrada.custoPrevisto);
  const comprometido = roundMoney2(entrada.custoComprometido);
  const incorrido = roundMoney2(entrada.custoIncorrido);
  const faturado = roundMoney2(entrada.custoFaturado);
  const pago = roundMoney2(entrada.custoPago);
  const aPagar = roundMoney2(Math.max(faturado - pago, 0));

  return {
    receita: {
      prevista: receitaPrevista,
      faturada: receitaFaturada,
      recebida: receitaRecebida,
    },
    custos: {
      previsto,
      comprometido,
      incorrido,
      faturado,
      pago,
      a_pagar: aPagar,
    },
    desvio_pago: roundMoney2(pago - previsto),
    desvio_comprometido: roundMoney2(comprometido - previsto),
    margem_prevista: roundMoney2(receitaPrevista - previsto),
    margem_caixa: roundMoney2(receitaRecebida - pago),
  };
}

function calcularProporcaoOs(valorOs, valorTotalApropriado) {
  const os = Number(valorOs);
  const total = Number(valorTotalApropriado);
  if (!Number.isFinite(os) || os <= 0) return 0;
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.min(os / total, 1);
}

function calcularIncorridoProporcional(params) {
  const qtyPedido = Number(params.quantidadePedido);
  const qtyAceita = Number(params.quantidadeAceita);
  const valorItem = Number(params.valorItem);
  if (qtyPedido <= 0 || qtyAceita <= 0 || valorItem <= 0) return 0;
  const realizadoItem = (qtyAceita / qtyPedido) * valorItem;
  const proporcao = calcularProporcaoOs(
    params.valorOsApropriado,
    params.valorTotalApropriado,
  );
  return roundMoney2(realizadoItem * proporcao);
}

test('roundMoney2 arredonda centavos', () => {
  assert.equal(roundMoney2(10.005), 10.01);
  assert.equal(roundMoney2(10.004), 10);
});

test('montarTotaisPosCalculo: margens e desvios', () => {
  const r = montarTotaisPosCalculo({
    receitaPrevista: 5000,
    receitaFaturada: 5000,
    receitaRecebida: 3500,
    custoPrevisto: 2300,
    custoComprometido: 2750,
    custoIncorrido: 2600,
    custoFaturado: 2600,
    custoPago: 1800,
  });

  assert.equal(r.receita.prevista, 5000);
  assert.equal(r.receita.recebida, 3500);
  assert.equal(r.custos.a_pagar, 800);
  assert.equal(r.desvio_pago, -500);
  assert.equal(r.desvio_comprometido, 450);
  assert.equal(r.margem_prevista, 2700);
  assert.equal(r.margem_caixa, 1700);
});

test('montarTotaisPosCalculo: a_pagar nunca negativo', () => {
  const r = montarTotaisPosCalculo({
    receitaPrevista: 1000,
    receitaFaturada: 1000,
    receitaRecebida: 1000,
    custoPrevisto: 400,
    custoComprometido: 400,
    custoIncorrido: 400,
    custoFaturado: 400,
    custoPago: 500,
  });
  assert.equal(r.custos.a_pagar, 0);
});

test('calcularProporcaoOs: compra compartilhada', () => {
  assert.equal(calcularProporcaoOs(300, 1000), 0.3);
  assert.equal(calcularProporcaoOs(1000, 0), 1);
});

test('calcularIncorridoProporcional: recebimento parcial', () => {
  const v = calcularIncorridoProporcional({
    quantidadePedido: 10,
    quantidadeAceita: 5,
    valorItem: 1000,
    valorOsApropriado: 600,
    valorTotalApropriado: 1000,
  });
  assert.equal(v, 300);
});

test('calcularIncorridoProporcional: quantidade zero retorna 0', () => {
  assert.equal(
    calcularIncorridoProporcional({
      quantidadePedido: 0,
      quantidadeAceita: 5,
      valorItem: 1000,
      valorOsApropriado: 600,
      valorTotalApropriado: 1000,
    }),
    0,
  );
});
