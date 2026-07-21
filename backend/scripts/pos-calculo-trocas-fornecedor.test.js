/**
 * Testes de mapeamento de trocas de fornecedor no pós-cálculo (funções puras).
 * Rodar: node --test scripts/pos-calculo-trocas-fornecedor.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

function extrairDadosSubstituicao(dados) {
  if (!dados || typeof dados !== 'object') {
    return {};
  }

  return {
    motivo: typeof dados.motivo === 'string' ? dados.motivo : undefined,
    pedidoSubstituidoId:
      typeof dados.pedido_substituido_id === 'string'
        ? dados.pedido_substituido_id
        : undefined,
    pedidoSubstitutoId:
      typeof dados.pedido_substituto_id === 'string'
        ? dados.pedido_substituto_id
        : undefined,
    fornecedorAnteriorId:
      typeof dados.fornecedor_anterior_id === 'string'
        ? dados.fornecedor_anterior_id
        : undefined,
    fornecedorId:
      typeof dados.fornecedor_id === 'string' ? dados.fornecedor_id : undefined,
  };
}

function montarTrocasSubstituicaoHistorico(historicos, pedidos, fornecedores) {
  const substituir = historicos.filter((h) => h.acao === 'SUBSTITUIR_FORNECEDOR');
  const cancelar = historicos.filter(
    (h) => h.acao === 'CANCELAR_POR_SUBSTITUICAO',
  );
  const paresSubstituir = new Set();
  const resultado = [];

  for (const historico of substituir) {
    const dados = extrairDadosSubstituicao(historico.dados);
    const pedidoId = historico.entidadeId;
    const pedido = pedidos.get(pedidoId);

    if (dados.pedidoSubstituidoId) {
      paresSubstituir.add(`${dados.pedidoSubstituidoId}:${pedidoId}`);
    }

    resultado.push({
      tipo: 'SUBSTITUICAO_PEDIDO',
      pedido_id: pedidoId,
      pedido_numero: pedido?.numero,
      fornecedor_previsto_id: dados.fornecedorAnteriorId,
      fornecedor_previsto_nome: dados.fornecedorAnteriorId
        ? fornecedores.get(dados.fornecedorAnteriorId)
        : undefined,
      fornecedor_efetivo_id: dados.fornecedorId,
      fornecedor_efetivo_nome: dados.fornecedorId
        ? fornecedores.get(dados.fornecedorId)
        : undefined,
      motivo: dados.motivo,
      em: historico.criadoEm,
    });
  }

  for (const historico of cancelar) {
    const dados = extrairDadosSubstituicao(historico.dados);
    const canceladoId = historico.entidadeId;
    const substitutoId = dados.pedidoSubstitutoId;

    if (substitutoId && paresSubstituir.has(`${canceladoId}:${substitutoId}`)) {
      continue;
    }

    const pedidoAlvoId = substitutoId ?? canceladoId;
    const pedido = pedidos.get(pedidoAlvoId);
    const cancelado = pedidos.get(canceladoId);
    const substituto = substitutoId ? pedidos.get(substitutoId) : undefined;

    resultado.push({
      tipo: 'SUBSTITUICAO_PEDIDO',
      pedido_id: pedidoAlvoId,
      pedido_numero: pedido?.numero,
      fornecedor_previsto_id: cancelado?.fornecedorId,
      fornecedor_previsto_nome: cancelado?.fornecedorNome,
      fornecedor_efetivo_id:
        substituto?.fornecedorId ?? cancelado?.fornecedorId,
      fornecedor_efetivo_nome:
        substituto?.fornecedorNome ?? cancelado?.fornecedorNome,
      motivo: dados.motivo,
      em: historico.criadoEm,
    });
  }

  return resultado;
}

function montarDesviosPrevistos(entradas, pedidosComSubstituicao) {
  const vistos = new Set();
  const resultado = [];

  for (const entrada of entradas) {
    if (pedidosComSubstituicao.has(entrada.pedidoId)) continue;
    if (
      !entrada.fornecedorPrevistoId ||
      entrada.fornecedorPrevistoId === entrada.fornecedorEfetivoId
    ) {
      continue;
    }

    const chave = `${entrada.pedidoId}:${entrada.fornecedorPrevistoId}:${entrada.fornecedorEfetivoId}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    resultado.push({
      tipo: 'DESVIO_PREVISTO',
      pedido_id: entrada.pedidoId,
      pedido_numero: entrada.pedidoNumero,
      fornecedor_previsto_id: entrada.fornecedorPrevistoId,
      fornecedor_previsto_nome: entrada.fornecedorPrevistoNome,
      fornecedor_efetivo_id: entrada.fornecedorEfetivoId,
      fornecedor_efetivo_nome: entrada.fornecedorEfetivoNome,
    });
  }

  return resultado;
}

test('montarTrocasSubstituicaoHistorico deduplica cancelamento pareado', () => {
  const pedidos = new Map([
    [
      'ped-old',
      {
        id: 'ped-old',
        numero: 'PC-001',
        fornecedorId: 'forn-a',
        fornecedorNome: 'Fornecedor A',
      },
    ],
    [
      'ped-new',
      {
        id: 'ped-new',
        numero: 'PC-002',
        fornecedorId: 'forn-b',
        fornecedorNome: 'Fornecedor B',
      },
    ],
  ]);
  const fornecedores = new Map([
    ['forn-a', 'Fornecedor A'],
    ['forn-b', 'Fornecedor B'],
  ]);

  const resultado = montarTrocasSubstituicaoHistorico(
    [
      {
        entidadeId: 'ped-old',
        acao: 'CANCELAR_POR_SUBSTITUICAO',
        criadoEm: '2026-07-21T10:00:00.000Z',
        dados: {
          motivo: 'Atraso',
          pedido_substituto_id: 'ped-new',
        },
      },
      {
        entidadeId: 'ped-new',
        acao: 'SUBSTITUIR_FORNECEDOR',
        criadoEm: '2026-07-21T10:00:01.000Z',
        dados: {
          motivo: 'Atraso',
          pedido_substituido_id: 'ped-old',
          fornecedor_anterior_id: 'forn-a',
          fornecedor_id: 'forn-b',
        },
      },
    ],
    pedidos,
    fornecedores,
  );

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].tipo, 'SUBSTITUICAO_PEDIDO');
  assert.equal(resultado[0].pedido_id, 'ped-new');
  assert.equal(resultado[0].fornecedor_previsto_id, 'forn-a');
  assert.equal(resultado[0].fornecedor_efetivo_id, 'forn-b');
});

test('montarDesviosPrevistos ignora pedido já substituído', () => {
  const desvios = montarDesviosPrevistos(
    [
      {
        pedidoId: 'ped-1',
        pedidoNumero: 'PC-010',
        fornecedorPrevistoId: 'forn-a',
        fornecedorPrevistoNome: 'A',
        fornecedorEfetivoId: 'forn-b',
        fornecedorEfetivoNome: 'B',
      },
    ],
    new Set(['ped-1']),
  );

  assert.deepEqual(desvios, []);
});

test('montarDesviosPrevistos detecta desvio previsto x efetivo', () => {
  const desvios = montarDesviosPrevistos(
    [
      {
        pedidoId: 'ped-1',
        pedidoNumero: 'PC-010',
        fornecedorPrevistoId: 'forn-a',
        fornecedorPrevistoNome: 'A',
        fornecedorEfetivoId: 'forn-b',
        fornecedorEfetivoNome: 'B',
      },
    ],
    new Set(),
  );

  assert.equal(desvios.length, 1);
  assert.equal(desvios[0].tipo, 'DESVIO_PREVISTO');
  assert.equal(desvios[0].pedido_numero, 'PC-010');
});
