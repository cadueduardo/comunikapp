/**
 * Testes das funções puras do PCP.
 * Execução: node frontend/scripts/validar-pcp.mjs
 */

import {
  alternarSetoresVisiveis,
  calcularScoreGargalo,
  classificarNivelGargalo,
  filtrarFilaPorStatus,
  montarQueryKanbanPorSetores,
  montarTopGargalos,
  resumoSelecaoSetores,
  selecionarCardsAtencao,
} from '../pcp.utils';

function assert(condicao: boolean, mensagem: string): void {
  if (!condicao) throw new Error(mensagem);
}

function assertIgual<T>(recebido: T, esperado: T, contexto: string): void {
  if (recebido !== esperado) {
    throw new Error(`[${contexto}] esperado ${String(esperado)}, recebido ${String(recebido)}`);
  }
}

export function executarTestesPcpUtils(): void {
  assertIgual(calcularScoreGargalo({ pendentes: 3, pausadas: 1, atrasadas: 2 }), 11, 'score');
  assertIgual(classificarNivelGargalo(11), 'ALTO', 'nivel alto');
  assertIgual(classificarNivelGargalo(4), 'MEDIO', 'nivel medio');
  assertIgual(classificarNivelGargalo(3), 'BAIXO', 'nivel baixo');

  const gargalos = montarTopGargalos(
    [
      {
        setor_id: 'a',
        titulo: 'A',
        score_gargalo: 5,
        nivel_gargalo: 'MEDIO',
        pendentes: 1,
        pausadas: 0,
        atrasadas: 0,
      },
      {
        setor_id: 'b',
        titulo: 'B',
        score_gargalo: 12,
        nivel_gargalo: 'ALTO',
        pendentes: 2,
        pausadas: 1,
        atrasadas: 2,
      },
      {
        setor_id: 'c',
        titulo: 'C',
        score_gargalo: 0,
        nivel_gargalo: 'BAIXO',
        pendentes: 0,
        pausadas: 0,
        atrasadas: 0,
      },
    ],
    2,
  );
  assertIgual(gargalos.length, 2, 'top gargalos limite');
  assertIgual(gargalos[0]?.setor_id, 'b', 'top gargalos ordem');

  const query = montarQueryKanbanPorSetores({
    operadorId: 'op-1',
    prioridade: 'ALTA',
    prazoBucket: 'atrasados',
    dataInicial: '2026-05-01',
    dataFinal: '2026-05-31',
  });
  assert(query.includes('operadorId=op-1'), 'query operador');
  assert(query.includes('prazoBucket=atrasados'), 'query prazo');

  const fila = [
    { status: 'PENDENTE' },
    { status: 'EM_ANDAMENTO' },
    { status: 'PAUSADA' },
  ];
  assertIgual(filtrarFilaPorStatus(fila, 'PENDENTE').length, 1, 'filtro fila');

  const ref = new Date('2026-05-28T12:00:00');
  const atencao = selecionarCardsAtencao(
    [
      { id: '1', status: 'FILA', data_prazo: '2026-05-01', alertas: [] },
      { id: '2', status: 'FILA', alertas: ['Sem prazo'] },
      { id: '3', status: 'CONCLUIDA', data_prazo: '2026-01-01', alertas: [] },
    ],
    6,
    ref,
  );
  assert(atencao.some((c) => c.id === '1'), 'atencao atrasado');
  assert(atencao.some((c) => c.id === '2'), 'atencao alerta');
  assert(!atencao.some((c) => c.id === '3'), 'atencao ignora concluida');

  assertIgual(
    JSON.stringify(alternarSetoresVisiveis([], 's1')),
    JSON.stringify(['s1']),
    'colunas opt-in',
  );
  assertIgual(
    JSON.stringify(alternarSetoresVisiveis(['s1', 's2', 's3'], 's2')),
    JSON.stringify(['s1', 's3']),
    'colunas remove um',
  );
  assertIgual(
    JSON.stringify(alternarSetoresVisiveis(['s1'], 's1')),
    JSON.stringify([]),
    'colunas ultimo desmarcado volta todas',
  );

  assertIgual(resumoSelecaoSetores([], 5), 'todos (5)', 'resumo todos');
  assertIgual(resumoSelecaoSetores(['a', 'b'], 5), '2 de 5', 'resumo parcial');
}
