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

const TIPOS_CATEGORIA = ['MATERIAL', 'SERVICO', 'DESPESA'];
const LABEL_CATEGORIA = {
  MATERIAL: 'Material',
  SERVICO: 'Serviço',
  DESPESA: 'Despesa',
};
const LIMIAR_DESVIO_ABSOLUTO = 50;
const LIMIAR_DESVIO_RELATIVO = 0.05;
const LIMIAR_DESVIO_CRITICO_ABSOLUTO = 500;
const LIMIAR_DESVIO_CRITICO_RELATIVO = 0.15;

function criarBucketsCategoria(previstoPorTipo = {}) {
  const buckets = {};
  for (const tipo of TIPOS_CATEGORIA) {
    buckets[tipo] = {
      previsto: roundMoney2(previstoPorTipo[tipo] ?? 0),
      comprometido: 0,
      incorrido: 0,
      faturado: 0,
      pago: 0,
    };
  }
  return buckets;
}

function calcularPrevistoPorTipoItem(produtos) {
  const previsto = { MATERIAL: 0, SERVICO: 0, DESPESA: 0 };
  for (const produto of produtos) {
    for (const insumo of produto.insumos ?? []) {
      if (!insumo.material_do_cliente) {
        previsto.MATERIAL += Number(insumo.preco_total);
      }
    }
    for (const servico of produto.servicos_manuais ?? []) {
      previsto.SERVICO += Number(servico.custo_total);
    }
    if (produto.terceirizacao_custo_total) {
      previsto.SERVICO += Number(produto.terceirizacao_custo_total);
    }
    for (const maquina of produto.maquinas ?? []) {
      previsto.DESPESA += Number(maquina.custo_total);
    }
    for (const funcao of produto.funcoes ?? []) {
      previsto.DESPESA += Number(funcao.custo_total);
    }
    for (const indireto of produto.custos_indiretos ?? []) {
      previsto.DESPESA += Number(indireto.custo_total);
    }
  }
  return {
    MATERIAL: roundMoney2(previsto.MATERIAL),
    SERVICO: roundMoney2(previsto.SERVICO),
    DESPESA: roundMoney2(previsto.DESPESA),
  };
}

function acumularBucketCategoria(buckets, categoria, campo, valor) {
  if (!Number.isFinite(valor) || valor === 0) return;
  buckets[categoria][campo] = roundMoney2(buckets[categoria][campo] + valor);
}

function montarLinhasCategorias(buckets) {
  const linhas = [];
  for (const categoria of TIPOS_CATEGORIA) {
    const bucket = buckets[categoria];
    const temDado =
      bucket.previsto !== 0 ||
      bucket.comprometido !== 0 ||
      bucket.incorrido !== 0 ||
      bucket.faturado !== 0 ||
      bucket.pago !== 0;
    if (!temDado) continue;
    linhas.push({
      categoria,
      label: LABEL_CATEGORIA[categoria],
      previsto: roundMoney2(bucket.previsto),
      comprometido: roundMoney2(bucket.comprometido),
      incorrido: roundMoney2(bucket.incorrido),
      faturado: roundMoney2(bucket.faturado),
      pago: roundMoney2(bucket.pago),
      desvio_pago: roundMoney2(bucket.pago - bucket.previsto),
      desvio_comprometido: roundMoney2(bucket.comprometido - bucket.previsto),
    });
  }
  return linhas;
}

function isDesvioRelevante(desvio, previsto) {
  const abs = Math.abs(desvio);
  if (abs < 0.01) return false;
  if (abs >= LIMIAR_DESVIO_ABSOLUTO) return true;
  if (previsto > 0 && abs / previsto >= LIMIAR_DESVIO_RELATIVO) return true;
  return false;
}

function severidadeDesvio(desvio, previsto) {
  if (previsto > 0 && desvio / previsto >= LIMIAR_DESVIO_CRITICO_RELATIVO) {
    return 'critico';
  }
  if (Math.abs(desvio) >= LIMIAR_DESVIO_CRITICO_ABSOLUTO) return 'critico';
  return 'alerta';
}

function montarPendenciasPosCalculo({ totais, categorias, limitacoes }) {
  const pendencias = [];
  const previstoTotal = totais.custos.previsto;

  if (totais.custos.a_pagar > 0) {
    pendencias.push({
      tipo: 'CONTA_A_PAGAR',
      descricao: `Saldo a pagar apropriado à OS: R$ ${totais.custos.a_pagar.toFixed(2)}.`,
      severidade: 'alerta',
    });
  }

  if (
    totais.desvio_pago > 0 &&
    isDesvioRelevante(totais.desvio_pago, previstoTotal)
  ) {
    pendencias.push({
      tipo: 'DESVIO_CUSTO',
      descricao: `Custo pago acima do previsto em R$ ${totais.desvio_pago.toFixed(2)}.`,
      severidade: severidadeDesvio(totais.desvio_pago, previstoTotal),
    });
  }

  if (
    totais.desvio_comprometido > 0 &&
    isDesvioRelevante(totais.desvio_comprometido, previstoTotal)
  ) {
    pendencias.push({
      tipo: 'DESVIO_COMPROMETIDO',
      descricao: `Comprometido acima do previsto em R$ ${totais.desvio_comprometido.toFixed(2)}.`,
      severidade: severidadeDesvio(totais.desvio_comprometido, previstoTotal),
    });
  }

  for (const cat of categorias) {
    if (cat.desvio_pago > 0 && isDesvioRelevante(cat.desvio_pago, cat.previsto)) {
      pendencias.push({
        tipo: 'DESVIO_CUSTO_CATEGORIA',
        descricao: `${cat.label}: pago acima do previsto em R$ ${cat.desvio_pago.toFixed(2)}.`,
        severidade: severidadeDesvio(cat.desvio_pago, cat.previsto),
      });
    }
    if (
      cat.desvio_comprometido > 0 &&
      isDesvioRelevante(cat.desvio_comprometido, cat.previsto)
    ) {
      pendencias.push({
        tipo: 'DESVIO_COMPROMETIDO_CATEGORIA',
        descricao: `${cat.label}: comprometido acima do previsto em R$ ${cat.desvio_comprometido.toFixed(2)}.`,
        severidade: severidadeDesvio(cat.desvio_comprometido, cat.previsto),
      });
    }
  }

  if (limitacoes.some((l) => l.includes('baseline indisponível'))) {
    pendencias.push({
      tipo: 'BASELINE_AUSENTE',
      descricao: 'OS sem baseline de custo previsto confiável.',
      severidade: 'info',
    });
  }

  return pendencias;
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

test('calcularPrevistoPorTipoItem: mapeia orçamento para MATERIAL/SERVICO/DESPESA', () => {
  const previsto = calcularPrevistoPorTipoItem([
    {
      insumos: [{ preco_total: 1000, material_do_cliente: false }],
      servicos_manuais: [{ custo_total: 200 }],
      terceirizacao_custo_total: 300,
      maquinas: [{ custo_total: 150 }],
      funcoes: [{ custo_total: 50 }],
      custos_indiretos: [{ custo_total: 25 }],
    },
  ]);
  assert.equal(previsto.MATERIAL, 1000);
  assert.equal(previsto.SERVICO, 500);
  assert.equal(previsto.DESPESA, 225);
});

test('montarLinhasCategorias: omite categorias zeradas', () => {
  const buckets = criarBucketsCategoria({ MATERIAL: 1000, SERVICO: 0, DESPESA: 0 });
  acumularBucketCategoria(buckets, 'MATERIAL', 'pago', 1200);
  const linhas = montarLinhasCategorias(buckets);
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].categoria, 'MATERIAL');
  assert.equal(linhas[0].desvio_pago, 200);
});

test('montarPendenciasPosCalculo: desvio comprometido e por categoria', () => {
  const totais = montarTotaisPosCalculo({
    receitaPrevista: 10000,
    receitaFaturada: 10000,
    receitaRecebida: 8000,
    custoPrevisto: 2000,
    custoComprometido: 2600,
    custoIncorrido: 2400,
    custoFaturado: 2400,
    custoPago: 1500,
  });
  const categorias = [
    {
      categoria: 'MATERIAL',
      label: 'Material',
      previsto: 1500,
      comprometido: 1800,
      incorrido: 1700,
      faturado: 1700,
      pago: 1600,
      desvio_pago: 100,
      desvio_comprometido: 300,
    },
  ];
  const pendencias = montarPendenciasPosCalculo({
    totais,
    categorias,
    limitacoes: [],
  });

  assert.ok(pendencias.some((p) => p.tipo === 'DESVIO_COMPROMETIDO'));
  assert.ok(pendencias.some((p) => p.tipo === 'DESVIO_CUSTO_CATEGORIA'));
  assert.ok(pendencias.some((p) => p.tipo === 'DESVIO_COMPROMETIDO_CATEGORIA'));
});

test('isDesvioRelevante: ignora ruído pequeno', () => {
  assert.equal(isDesvioRelevante(10, 5000), false);
  assert.equal(isDesvioRelevante(60, 5000), true);
  assert.equal(isDesvioRelevante(300, 5000), true);
});

test('severidadeDesvio: critico em desvio alto', () => {
  assert.equal(severidadeDesvio(600, 2000), 'critico');
  assert.equal(severidadeDesvio(100, 2000), 'alerta');
});
