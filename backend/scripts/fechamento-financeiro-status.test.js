/**
 * Testes de transição de status do fechamento financeiro (funções puras).
 * Rodar: node --test scripts/fechamento-financeiro-status.test.js
 */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const STATUS = {
  PENDENTE: 'PENDENTE',
  EM_CONCILIACAO: 'EM_CONCILIACAO',
  FECHADO: 'FECHADO',
  REABERTO: 'REABERTO',
};

function transicionarParaFechado(statusAtual) {
  if (statusAtual === STATUS.FECHADO) {
    return { status: STATUS.FECHADO, alterado: false };
  }
  return { status: STATUS.FECHADO, alterado: true };
}

function transicionarParaReaberto(params) {
  const motivo = params.motivo?.trim() ?? '';
  if (!motivo) {
    return {
      ok: false,
      codigo: 'MOTIVO_OBRIGATORIO',
      mensagem: 'Motivo é obrigatório para reabertura do fechamento financeiro.',
    };
  }

  if (params.statusAtual !== STATUS.FECHADO) {
    return {
      ok: false,
      codigo: 'STATUS_INVALIDO',
      mensagem: 'Somente fechamento com status FECHADO pode ser reaberto.',
    };
  }

  return {
    ok: true,
    status: STATUS.REABERTO,
    versao: params.versaoAtual + 1,
    limparFechamento: true,
  };
}

function montarAvisosFechamentoMvp(pendencias) {
  const avisos = new Set();
  for (const pendencia of pendencias) {
    if (pendencia.severidade === 'critico') {
      avisos.add(pendencia.descricao);
    }
    if (pendencia.tipo === 'CONTA_A_PAGAR') {
      avisos.add(pendencia.descricao);
    }
  }
  return [...avisos];
}

test('PENDENTE → FECHADO altera status', () => {
  const resultado = transicionarParaFechado(STATUS.PENDENTE);
  assert.equal(resultado.status, STATUS.FECHADO);
  assert.equal(resultado.alterado, true);
});

test('FECHADO → FECHADO é idempotente', () => {
  const resultado = transicionarParaFechado(STATUS.FECHADO);
  assert.equal(resultado.status, STATUS.FECHADO);
  assert.equal(resultado.alterado, false);
});

test('REABERTO → FECHADO altera status', () => {
  const resultado = transicionarParaFechado(STATUS.REABERTO);
  assert.equal(resultado.status, STATUS.FECHADO);
  assert.equal(resultado.alterado, true);
});

test('FECHADO → REABERTO incrementa versão', () => {
  const resultado = transicionarParaReaberto({
    statusAtual: STATUS.FECHADO,
    motivo: 'Ajuste de apropriação pendente',
    versaoAtual: 2,
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.status, STATUS.REABERTO);
  assert.equal(resultado.versao, 3);
  assert.equal(resultado.limparFechamento, true);
});

test('reabrir sem motivo é rejeitado', () => {
  const vazio = transicionarParaReaberto({
    statusAtual: STATUS.FECHADO,
    motivo: '',
    versaoAtual: 1,
  });
  assert.equal(vazio.ok, false);
  assert.equal(vazio.codigo, 'MOTIVO_OBRIGATORIO');

  const espacos = transicionarParaReaberto({
    statusAtual: STATUS.FECHADO,
    motivo: '   ',
    versaoAtual: 1,
  });
  assert.equal(espacos.ok, false);
  assert.equal(espacos.codigo, 'MOTIVO_OBRIGATORIO');
});

test('reabrir de status não FECHADO é rejeitado', () => {
  const resultado = transicionarParaReaberto({
    statusAtual: STATUS.PENDENTE,
    motivo: 'Tentativa inválida',
    versaoAtual: 1,
  });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, 'STATUS_INVALIDO');
});

test('montarAvisosFechamentoMvp inclui crítico e conta a pagar', () => {
  const avisos = montarAvisosFechamentoMvp([
    {
      tipo: 'DESVIO_CUSTO',
      descricao: 'Custo pago acima do previsto em R$ 600,00.',
      severidade: 'critico',
    },
    {
      tipo: 'CONTA_A_PAGAR',
      descricao: 'Saldo a pagar apropriado à OS: R$ 800,00.',
      severidade: 'alerta',
    },
    {
      tipo: 'LIMITACAO',
      descricao: 'Baseline indisponível.',
      severidade: 'info',
    },
  ]);

  assert.equal(avisos.length, 2);
  assert.ok(avisos.some((a) => a.includes('600')));
  assert.ok(avisos.some((a) => a.includes('800')));
});
