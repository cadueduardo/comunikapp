// Validação da navegação Vendas (Fase 3) sem Jest no frontend.
// Rodar: node frontend/scripts/validar-vendas-nav.mjs

import { strict as assert } from 'node:assert';

function migrateSidebarOrderIds(savedOrder) {
  const out = [];
  let vendasInserido = false;
  for (const id of savedOrder) {
    if (id === 'orcamentos' || id === 'clientes') {
      if (!vendasInserido) {
        out.push('vendas');
        vendasInserido = true;
      }
      continue;
    }
    if (id === 'vendas') {
      if (!vendasInserido) {
        out.push('vendas');
        vendasInserido = true;
      }
      continue;
    }
    out.push(id);
  }
  return out;
}

function mergeSidebarOrder(savedOrder, availableIds) {
  const migrated = migrateSidebarOrderIds(savedOrder);
  const validSaved = migrated.filter((id) => availableIds.includes(id));
  const missing = availableIds.filter((id) => !validSaved.includes(id));
  return [...validSaved, ...missing];
}

function buildSidebarIds(permissions) {
  const ids = ['dashboard'];
  if (permissions.podeVerVendas) ids.push('vendas');
  ids.push(
    'insumos',
    'fornecedores',
    'compras',
    'estoque',
    'modelos',
    'catalogo',
    'os',
    'arte',
  );
  if (permissions.podeVerFinanceiro) ids.push('financeiro');
  ids.push('pcp');
  if (permissions.podeVerExpedicao) ids.push('expedicao');
  if (permissions.podeVerInstalacaoGestao) ids.push('instalacao');
  ids.push('centros-trabalho');
  return ids;
}

const vendasItems = [
  { id: 'visao-geral', href: '/vendas' },
  { id: 'orcamentos', href: '/orcamentos-v2' },
  { id: 'clientes', href: '/clientes' },
  { id: 'simulador', href: '/orcamentos-v2/simulador' },
  { id: 'aditivos', href: '/vendas/aditivos' },
];

function filtrarAditivos(items, habilitados) {
  return items.filter((i) => (i.id === 'aditivos' ? habilitados : true));
}

// --- cenários ---

assert.deepEqual(
  buildSidebarIds({
    podeVerVendas: true,
    podeVerFinanceiro: false,
    podeVerExpedicao: false,
    podeVerInstalacaoGestao: true,
  }).includes('vendas'),
  true,
);
assert.equal(
  buildSidebarIds({
    podeVerVendas: true,
    podeVerFinanceiro: false,
    podeVerExpedicao: false,
    podeVerInstalacaoGestao: true,
  }).includes('orcamentos'),
  false,
);
assert.equal(
  buildSidebarIds({
    podeVerVendas: true,
    podeVerFinanceiro: false,
    podeVerExpedicao: false,
    podeVerInstalacaoGestao: true,
  }).includes('financeiro'),
  false,
  'vendedor não vê Financeiro',
);

assert.equal(
  buildSidebarIds({
    podeVerVendas: false,
    podeVerFinanceiro: false,
    podeVerExpedicao: false,
    podeVerInstalacaoGestao: false,
  }).includes('vendas'),
  false,
  'sem acesso não vê Vendas',
);

assert.ok(
  buildSidebarIds({
    podeVerVendas: true,
    podeVerFinanceiro: true,
    podeVerExpedicao: false,
    podeVerInstalacaoGestao: true,
  }).includes('financeiro'),
  'gestor/financeiro vê Financeiro',
);

assert.deepEqual(
  migrateSidebarOrderIds(['dashboard', 'orcamentos', 'clientes', 'estoque']),
  ['dashboard', 'vendas', 'estoque'],
);

assert.deepEqual(
  mergeSidebarOrder(
    ['dashboard', 'orcamentos', 'clientes'],
    ['dashboard', 'vendas', 'estoque'],
  ),
  ['dashboard', 'vendas', 'estoque'],
);

const cards = filtrarAditivos(vendasItems, true).filter(
  (i) => i.id !== 'visao-geral',
);
assert.ok(cards.some((c) => c.id === 'orcamentos'));
assert.ok(cards.some((c) => c.id === 'clientes'));
assert.ok(cards.some((c) => c.id === 'simulador'));

const semAditivos = filtrarAditivos(vendasItems, false).map((i) => i.id);
assert.equal(semAditivos.includes('aditivos'), false);

const aliases = Object.fromEntries(vendasItems.map((i) => [i.id, i.href]));
assert.equal(aliases.orcamentos, '/orcamentos-v2');
assert.equal(aliases.clientes, '/clientes');
assert.equal(aliases.simulador, '/orcamentos-v2/simulador');

console.log(
  JSON.stringify({
    ok: true,
    cenarios: [
      'vendedor_ve_vendas_sem_financeiro',
      'sem_acesso_nao_ve_vendas',
      'financeiro_ve_financeiro',
      'migracao_ordem_sidebar',
      'cards_e_aliases',
      'aditivos_filtrados',
    ],
  }),
);
