/**
 * Testes de isolamento tenant (IDOR) — Compras / Financeiro.
 *
 * Documenta a regra: toda consulta/mutação por ID deve incluir loja_id do JWT.
 * Usa funções puras + mocks leves (sem banco, sem Jest).
 *
 * Uso:
 *   node --test scripts/compras-financeiro-tenant-isolation.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundException';
  }
}

/** Espelha PedidosService.findOne — backend/src/compras/services/pedidos.service.ts */
function findPedidoWhere(id, lojaId) {
  return { id, loja_id: lojaId };
}

function resolvePedidoOrNotFound(pedido, id) {
  if (!pedido) {
    throw new NotFoundError(
      `Pedido de compra com ID "${id}" não encontrado.`,
    );
  }
  return pedido;
}

/** Espelha PosCalculoService.obterPorOs — where da OS */
function findOsPosCalculoWhere(osId, lojaId) {
  return { id: osId, loja_id: lojaId };
}

function resolveOsOrNotFound(os) {
  if (!os) {
    throw new NotFoundError('Ordem de serviço não encontrada.');
  }
  return os;
}

/** Espelha FechamentoFinanceiroOsService.assertOsDaLoja */
function findOsFechamentoWhere(osId, lojaId) {
  return { id: osId, loja_id: lojaId, ativo: true };
}

/** Espelha updatePedidoTenantSafe — backend/src/compras/services/pedido-matriz.util.ts */
async function updatePedidoTenantSafe(prisma, id, lojaId, data) {
  const result = await prisma.pedidoCompra.updateMany({
    where: { id, loja_id: lojaId },
    data,
  });
  if (result.count !== 1) {
    throw new NotFoundError(
      `Pedido de compra com ID "${id}" não encontrado.`,
    );
  }
}

function createMockPrisma(responses) {
  return {
    pedidoCompra: {
      findFirst: async ({ where }) => {
        const key = `${where.id}:${where.loja_id}`;
        return responses.findFirst?.[key] ?? null;
      },
      updateMany: async ({ where }) => {
        const key = `${where.id}:${where.loja_id}`;
        const count = responses.updateMany?.[key] ?? 0;
        return { count };
      },
    },
    ordemServico: {
      findFirst: async ({ where }) => {
        const key = `${where.id}:${where.loja_id}`;
        return responses.osFindFirst?.[key] ?? null;
      },
    },
  };
}

describe('isolamento tenant — pedido por id', () => {
  it('monta where com id + loja_id', () => {
    assert.deepEqual(findPedidoWhere('ped-1', 'loja-A'), {
      id: 'ped-1',
      loja_id: 'loja-A',
    });
  });

  it('retorna NotFound quando pedido pertence a outra loja (mock findFirst null)', async () => {
    const prisma = createMockPrisma({
      findFirst: { 'ped-1:loja-A': { id: 'ped-1', loja_id: 'loja-A' } },
    });
    const pedido = await prisma.pedidoCompra.findFirst({
      where: findPedidoWhere('ped-1', 'loja-B'),
    });
    assert.throws(
      () => resolvePedidoOrNotFound(pedido, 'ped-1'),
      NotFoundError,
    );
  });

  it('updateMany tenant-safe falha com count 0 para loja errada', async () => {
    const prisma = createMockPrisma({
      updateMany: { 'ped-1:loja-A': 1 },
    });
    await assert.rejects(
      () => updatePedidoTenantSafe(prisma, 'ped-1', 'loja-B', { status: 'X' }),
      NotFoundError,
    );
  });

  it('updateMany tenant-safe aceita quando loja confere', async () => {
    const prisma = createMockPrisma({
      updateMany: { 'ped-1:loja-A': 1 },
    });
    await assert.doesNotReject(() =>
      updatePedidoTenantSafe(prisma, 'ped-1', 'loja-A', { status: 'ENVIADO' }),
    );
  });
});

describe('isolamento tenant — pós-cálculo OS', () => {
  it('where inclui loja_id da sessão', () => {
    assert.deepEqual(findOsPosCalculoWhere('os-99', 'loja-X'), {
      id: 'os-99',
      loja_id: 'loja-X',
    });
  });

  it('NotFound quando OS existe em outra loja', async () => {
    const prisma = createMockPrisma({
      osFindFirst: { 'os-99:loja-X': { id: 'os-99', numero: 100 } },
    });
    const os = await prisma.ordemServico.findFirst({
      where: findOsPosCalculoWhere('os-99', 'loja-Y'),
    });
    assert.throws(() => resolveOsOrNotFound(os), NotFoundError);
  });

  it('encontra OS quando loja confere', async () => {
    const prisma = createMockPrisma({
      osFindFirst: { 'os-99:loja-X': { id: 'os-99', numero: 100 } },
    });
    const os = await prisma.ordemServico.findFirst({
      where: findOsPosCalculoWhere('os-99', 'loja-X'),
    });
    assert.equal(resolveOsOrNotFound(os).id, 'os-99');
  });
});

describe('isolamento tenant — fechamento financeiro OS', () => {
  it('where exige os ativa na loja', () => {
    assert.deepEqual(findOsFechamentoWhere('os-1', 'loja-Z'), {
      id: 'os-1',
      loja_id: 'loja-Z',
      ativo: true,
    });
  });

  it('NotFound para fechamento quando loja diverge', async () => {
    const prisma = createMockPrisma({
      osFindFirst: { 'os-1:loja-Z': { id: 'os-1' } },
    });
    const os = await prisma.ordemServico.findFirst({
      where: findOsFechamentoWhere('os-1', 'loja-W'),
    });
    assert.throws(() => resolveOsOrNotFound(os), NotFoundError);
  });
});

describe('regra documentada — listagens', () => {
  it('findMany sempre filtra loja_id (padrão pedidos/solicitações/contas)', () => {
    const listWhere = (lojaId) => ({ loja_id: lojaId });
    assert.deepEqual(listWhere('loja-1'), { loja_id: 'loja-1' });
    assert.notDeepEqual(listWhere('loja-1'), { loja_id: 'loja-2' });
  });
});
