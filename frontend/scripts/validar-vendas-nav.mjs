// Verifica os contratos diretamente nos arquivos usados pela aplicação.
// Rodar: npm run test:vendas-nav

import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';

async function ler(relativo) {
  return readFile(new URL(`../${relativo}`, import.meta.url), 'utf8');
}

const [sidebar, layoutPrincipal, vendasNav, vendasPage, ...layoutsProtegidos] =
  await Promise.all([
    ler('src/lib/sidebar-menu.tsx'),
    ler('src/app/(main)/layout.tsx'),
    ler('src/lib/module-nav/vendas.ts'),
    ler('src/app/(main)/vendas/page.tsx'),
    ler('src/app/(main)/vendas/layout.tsx'),
    ler('src/app/(main)/orcamentos-v2/layout.tsx'),
    ler('src/app/(main)/clientes/layout.tsx'),
  ]);

assert.match(sidebar, /if \(permissions\.podeVerVendas\)/);
assert.match(sidebar, /id: 'vendas'[\s\S]*?href: '\/vendas'/);
assert.doesNotMatch(sidebar, /items\.push\([\s\S]*?id: 'orcamentos'/);
assert.doesNotMatch(sidebar, /items\.push\([\s\S]*?id: 'clientes'/);
assert.match(sidebar, /migrateSidebarOrderIds\(savedOrder/);
assert.match(sidebar, /id === 'orcamentos' \|\| id === 'clientes'/);

assert.match(layoutPrincipal, /podeVerVendas: vendasAcesso\.pode_acessar_modulo === true/);
assert.match(
  layoutPrincipal,
  /podeVerFinanceiro: \['ADMINISTRADOR', 'FINANCEIRO'\]\.includes\(funcao\)/,
);

for (const [id, href] of [
  ['minha-carteira', '/vendas/carteira'],
  ['orcamentos', '/orcamentos-v2'],
  ['clientes', '/clientes'],
  ['simulador', '/orcamentos-v2/simulador'],
  ['atividades', '/vendas/atividades'],
  ['novo-atendimento', '/vendas/atendimento'],
]) {
  assert.match(vendasNav, new RegExp(`id: '${id}'[\\s\\S]*?href: '${href}'`));
}
assert.match(vendasNav, /item\.id === 'aditivos'/);
assert.match(vendasPage, /Novo atendimento|prioridades|aprovadas_periodo/);
assert.doesNotMatch(vendasPage, /ModuleHubCards/);

const [carteiraPage, listagem, columns] = await Promise.all([
  ler('src/app/(main)/vendas/carteira/page.tsx'),
  ler('src/components/clientes/ClientesCarteiraListagem.tsx'),
  ler('src/app/(main)/clientes/columns.tsx'),
]);
assert.match(carteiraPage, /ClientesCarteiraListagem/);
assert.match(listagem, /useState<'table' \| 'cards'>\('table'\)/);
assert.match(listagem, /enablePagination=\{false\}/);
assert.match(listagem, /grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3/);
assert.match(columns, /ClienteAcoesMenu/);

for (const layout of layoutsProtegidos) {
  assert.match(layout, /<VendasAccessGate>/);
  assert.match(
    layout,
    /<VendasAccessGate>[\s\S]*?<ModuleLayoutShell[\s\S]*?<\/ModuleLayoutShell>[\s\S]*?<\/VendasAccessGate>/,
  );
}

console.log(
  JSON.stringify({
    ok: true,
    contratos: [
      'sidebar_condicionada_ao_backend',
      'orcamentos_e_clientes_fora_do_global',
      'migracao_da_ordem_legada',
      'financeiro_oculto_para_vendas',
      'cards_e_aliases_canonicos',
      'aditivos_filtrados',
      'rotas_vendas_e_aliases_protegidos',
      'carteira_nav_e_template_crud',
      'atividades_e_atendimento_nav',
      'home_acionavel_sem_hub_cards',
    ],
  }),
);
