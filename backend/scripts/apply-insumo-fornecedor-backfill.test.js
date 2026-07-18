const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CONFIRMATION,
  assertCanApply,
  buildReport,
  databaseName,
  parseArgs,
} = require('./apply-insumo-fornecedor-backfill');

test('dry-run e o padrao e nao aceita credenciais de apply', () => {
  const options = parseArgs(['--dry-run', '--loja-id=loja-1']);
  assert.equal(options.apply, false);
  assert.equal(options.lojaId, 'loja-1');
  assert.throws(
    () => parseArgs(['--confirmation=x']),
    /so podem ser usados com --apply/,
  );
});

test('apply exige confirmacao exata antes de validar backup', () => {
  assert.throws(() => parseArgs(['--apply']), new RegExp(CONFIRMATION));
  assert.throws(
    () => parseArgs(['--apply', `--confirmation=${CONFIRMATION}`]),
    /--backup/,
  );
});

test('nome do banco e derivado da URL e validado', () => {
  assert.equal(
    databaseName('mysql://user:pass@localhost:3306/comunikapp_stage'),
    'comunikapp_stage',
  );
  assert.throws(
    () => databaseName('mysql://user:pass@localhost:3306/nome-invalido'),
    /padrao seguro/,
  );
});

test('aplicacao bloqueia duplicatas e fornecedores invalidos', () => {
  assert.doesNotThrow(() =>
    assertCanApply({ duplicate_groups: [], invalid_suppliers: [] }),
  );
  assert.throws(
    () =>
      assertCanApply({
        duplicate_groups: [{ loja_id: '1', nome: 'Lona', total: 2 }],
        invalid_suppliers: [],
      }),
    /Nenhuma deduplicacao automatica/,
  );
  assert.throws(
    () =>
      assertCanApply({
        duplicate_groups: [],
        invalid_suppliers: [{ insumo_id: '1' }],
      }),
    /fornecedor\(es\) legado\(s\) incompativel/,
  );
});

test('relatorio nao inclui caminho completo do backup', () => {
  const report = buildReport(
    'apply-backfill',
    'comunikapp_stage',
    {
      apply: true,
      backup: '/segredo/backups/comunikapp.sql.gz',
      lojaId: null,
    },
    { affected_rows: 2 },
  );
  assert.equal(report.backup, 'comunikapp.sql.gz');
  assert.equal(report.database, 'comunikapp_stage');
});
