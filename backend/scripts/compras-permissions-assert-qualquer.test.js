/**
 * assertPodeQualquer — OR de permissões (sem Nest/Prisma real).
 * node --test scripts/compras-permissions-assert-qualquer.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

async function assertPodeQualquer(podeFn, acoes, rotulo = 'consultar') {
  if (!acoes.length) {
    throw new Error(`Você não tem permissão para ${rotulo}.`);
  }
  for (const acao of acoes) {
    if (await podeFn(acao)) {
      return;
    }
  }
  throw new Error(`Você não tem permissão para ${rotulo}.`);
}

describe('assertPodeQualquer', () => {
  it('aceita quando a segunda permissão bate', async () => {
    const pode = async (acao) => acao === 'compras.pedido.criar';
    await assert.doesNotReject(() =>
      assertPodeQualquer(pode, [
        'compras.auditoria.visualizar',
        'compras.pedido.criar',
      ]),
    );
  });

  it('rejeita quando nenhuma permissão bate', async () => {
    const pode = async () => false;
    await assert.rejects(
      () =>
        assertPodeQualquer(pode, ['compras.pedido.criar'], 'listar pedidos'),
      /listar pedidos/,
    );
  });

  it('rejeita lista vazia', async () => {
    await assert.rejects(
      () => assertPodeQualquer(async () => true, []),
      /permissão/,
    );
  });
});
