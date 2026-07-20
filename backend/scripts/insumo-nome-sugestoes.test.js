const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const controller = fs.readFileSync(
  path.join(backendRoot, 'src', 'insumos', 'insumos.controller.ts'),
  'utf8',
);
const service = fs.readFileSync(
  path.join(backendRoot, 'src', 'insumos', 'insumos.service.ts'),
  'utf8',
);
const sugestoesUi = fs.readFileSync(
  path.join(
    backendRoot,
    '..',
    'frontend',
    'src',
    'app',
    '(main)',
    'insumos',
    'nome-insumo-sugestoes.tsx',
  ),
  'utf8',
);

test('busca por nome fica antes das rotas :id', () => {
  const buscaIdx = controller.indexOf("@Get('busca')");
  const idIdx = controller.indexOf("@Get(':id')");
  assert.ok(buscaIdx > 0, 'rota /busca ausente');
  assert.ok(idIdx > buscaIdx, '/busca deve vir antes de /:id');
});

test('sugestoes sao leves e marcam match exato', () => {
  assert.match(service, /async buscarSugestoesPorNome/);
  assert.match(service, /nome: \{ contains: termo \}/);
  assert.match(service, /match_exato/);
  assert.match(service, /take: safeLimit/);
});

test('ui de sugestoes nao impede cadastro similar', () => {
  assert.match(sugestoesUi, /Insumos cadastrados/);
  assert.match(sugestoesUi, /Abrir/);
  assert.match(sugestoesUi, /Reativar/);
  assert.doesNotMatch(sugestoesUi, /disabled=\{true\}/);
});
