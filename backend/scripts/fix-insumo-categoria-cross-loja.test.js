const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(
  __dirname,
  'fix-insumo-categoria-cross-loja.js',
);
const servicePath = path.join(
  backendRoot,
  'src',
  'insumos',
  'insumos.service.ts',
);

const script = fs.readFileSync(scriptPath, 'utf8');
const service = fs.readFileSync(servicePath, 'utf8');

const {
  CONFIRMATION,
  parseArgs,
} = require('./fix-insumo-categoria-cross-loja.js');

test('script exige confirmação explícita no apply', () => {
  assert.equal(CONFIRMATION, 'CORRIGIR_CATEGORIA_CROSS_LOJA');
  const dry = parseArgs([]);
  assert.equal(dry.apply, false);
  const apply = parseArgs([
    '--apply',
    `--confirmation=${CONFIRMATION}`,
  ]);
  assert.equal(apply.apply, true);
  assert.equal(apply.confirmation, CONFIRMATION);
});

test('script só remapeia por nome único e aborta ambiguidade', () => {
  assert.match(script, /auto_remap_by_name/);
  assert.match(script, /ambiguous_name_match/);
  assert.match(script, /needs_manual/);
  assert.match(script, /Apply abortado/);
  assert.match(script, /updateMany/);
  assert.doesNotMatch(script, /deleteMany|DROP TABLE|TRUNCATE/i);
});

test('update de insumo valida categoria na mesma loja', () => {
  assert.match(
    service,
    /async update\([\s\S]*categoria\.findFirst\([\s\S]*loja_id: loja\.id/,
  );
  assert.match(
    service,
    /Categoria não encontrada na loja do insumo/,
  );
});
