// Validação das funções puras do PCP (sem Jest no frontend).
// Rodar: node frontend/scripts/validar-pcp.mjs
// ou: npm run test:pcp --prefix frontend

import { strict as assert } from 'node:assert';

function calcularScoreGargalo({ pendentes, pausadas, atrasadas }) {
  return pendentes * 1 + pausadas * 2 + atrasadas * 3;
}

function classificarNivelGargalo(score) {
  if (score >= 10) return 'ALTO';
  if (score >= 4) return 'MEDIO';
  return 'BAIXO';
}

function montarTopGargalos(colunas, limite = 3) {
  return colunas
    .filter((c) => c.score_gargalo > 0)
    .sort((a, b) => b.score_gargalo - a.score_gargalo)
    .slice(0, limite);
}

function montarQueryKanbanPorSetores(filtros) {
  const search = new URLSearchParams();
  if (filtros.operadorId) search.set('operadorId', filtros.operadorId);
  if (filtros.prioridade) search.set('prioridade', filtros.prioridade);
  if (filtros.prazoBucket) search.set('prazoBucket', filtros.prazoBucket);
  if (filtros.dataInicial) search.set('dataInicial', filtros.dataInicial);
  if (filtros.dataFinal) search.set('dataFinal', filtros.dataFinal);
  return search.toString();
}

function filtrarFilaPorStatus(fila, filtro) {
  if (filtro === 'TODOS') return fila;
  return fila.filter((item) => item.status === filtro);
}

function selecionarCardsAtencao(cards, limite = 6, referencia = new Date()) {
  const hoje = new Date(referencia);
  hoje.setHours(0, 0, 0, 0);
  return cards
    .filter((card) => {
      const temAlerta = Array.isArray(card.alertas) && card.alertas.length > 0;
      const prazo = card.data_prazo ? new Date(card.data_prazo) : null;
      const atrasado = !!prazo && prazo < hoje && card.status !== 'CONCLUIDA';
      return temAlerta || atrasado || !card.data_prazo;
    })
    .slice(0, limite);
}

function alternarSetoresVisiveis(setoresVisiveis, setorId) {
  const todosAtivos = setoresVisiveis.length === 0;
  if (todosAtivos) return [setorId];
  const proximo = setoresVisiveis.includes(setorId)
    ? setoresVisiveis.filter((id) => id !== setorId)
    : [...setoresVisiveis, setorId];
  if (proximo.length === 0) return [];
  return proximo;
}

function resumoSelecaoSetores(setoresVisiveis, totalSetores) {
  if (setoresVisiveis.length === 0) return `todos (${totalSetores})`;
  return `${setoresVisiveis.length} de ${totalSetores}`;
}

let ok = 0;

function test(nome, fn) {
  fn();
  ok += 1;
  console.log(`  ✓ ${nome}`);
}

console.log('Validando funções PCP...\n');

test('calcularScoreGargalo', () => {
  assert.equal(calcularScoreGargalo({ pendentes: 3, pausadas: 1, atrasadas: 2 }), 11);
});

test('classificarNivelGargalo', () => {
  assert.equal(classificarNivelGargalo(11), 'ALTO');
  assert.equal(classificarNivelGargalo(4), 'MEDIO');
  assert.equal(classificarNivelGargalo(3), 'BAIXO');
});

test('montarTopGargalos', () => {
  const top = montarTopGargalos(
    [
      { setor_id: 'a', score_gargalo: 5 },
      { setor_id: 'b', score_gargalo: 12 },
      { setor_id: 'c', score_gargalo: 0 },
    ],
    2,
  );
  assert.equal(top.length, 2);
  assert.equal(top[0].setor_id, 'b');
});

test('montarQueryKanbanPorSetores', () => {
  const q = montarQueryKanbanPorSetores({
    operadorId: 'op-1',
    prioridade: 'ALTA',
    prazoBucket: 'atrasados',
  });
  assert.match(q, /operadorId=op-1/);
  assert.match(q, /prazoBucket=atrasados/);
});

test('filtrarFilaPorStatus', () => {
  const fila = [{ status: 'PENDENTE' }, { status: 'PAUSADA' }];
  assert.equal(filtrarFilaPorStatus(fila, 'PENDENTE').length, 1);
});

test('selecionarCardsAtencao', () => {
  const ref = new Date('2026-05-28T12:00:00');
  const sel = selecionarCardsAtencao(
    [
      { id: '1', status: 'FILA', data_prazo: '2026-05-01', alertas: [] },
      { id: '2', status: 'FILA', alertas: ['x'] },
    ],
    6,
    ref,
  );
  assert.equal(sel.length, 2);
});

test('alternarSetoresVisiveis', () => {
  assert.deepEqual(alternarSetoresVisiveis([], 's1'), ['s1']);
  assert.deepEqual(alternarSetoresVisiveis(['s1', 's2', 's3'], 's2'), ['s1', 's3']);
  assert.deepEqual(alternarSetoresVisiveis(['s1'], 's1'), []);
});

test('resumoSelecaoSetores', () => {
  assert.equal(resumoSelecaoSetores([], 5), 'todos (5)');
  assert.equal(resumoSelecaoSetores(['a'], 5), '1 de 5');
});

console.log(`\n${ok} testes PCP OK.`);
