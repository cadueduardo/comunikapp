/**
 * Validação leve do parse de permissões — sem Jest/ts-jest (evita OOM).
 * node --test scripts/compras-permissions-parse.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

function parseAcaoCompleta(acaoCompleta) {
  const partes = acaoCompleta.split('.');
  if (partes.length < 2 || !partes[0]) {
    throw new Error(`Permissão de compras inválida: "${acaoCompleta}"`);
  }
  return { modulo: partes[0], acao: partes.slice(1).join('.') };
}

describe('compras permissions parse', () => {
  it('separa modulo e acao composta', () => {
    assert.deepEqual(parseAcaoCompleta('compras.solicitacao.criar'), {
      modulo: 'compras',
      acao: 'solicitacao.criar',
    });
  });

  it('rejeita string inválida', () => {
    assert.throws(() => parseAcaoCompleta('compras'), /inválida/);
  });
});
