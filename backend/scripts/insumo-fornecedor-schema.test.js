const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(backendRoot, 'prisma', 'schema.prisma');
const migrationName = '20260717201405_create_insumo_fornecedores';
const migrationPath = path.join(
  backendRoot,
  'prisma',
  'migrations',
  migrationName,
  'migration.sql',
);
const finalMigrationName = '20260718143847_update_insumo_unique';
const finalMigrationPath = path.join(
  backendRoot,
  'prisma',
  'migrations',
  finalMigrationName,
  'migration.sql',
);

const schema = fs.readFileSync(schemaPath, 'utf8');
const migration = fs.readFileSync(migrationPath, 'utf8');
const finalMigration = fs.readFileSync(finalMigrationPath, 'utf8');

test('migration usa timestamp real de 14 digitos e nome descritivo', () => {
  assert.match(migrationName, /^\d{14}_create_insumo_fornecedores$/);
});

test('schema usa unique final e declara matriz multi-tenant', () => {
  assert.match(schema, /@@unique\(\[loja_id, nome\]\)/);
  assert.doesNotMatch(schema, /@@unique\(\[loja_id, nome, fornecedorId\]\)/);
  assert.match(schema, /model InsumoFornecedor \{/);
  assert.match(schema, /@@id\(\[insumo_id, fornecedor_id\]\)/);
  assert.match(schema, /@@index\(\[loja_id, insumo_id\]\)/);
  assert.match(schema, /@@index\(\[loja_id, fornecedor_id\]\)/);
  assert.match(schema, /@@map\("insumo_fornecedores"\)/);
  assert.match(schema, /fornecedores_associados InsumoFornecedor\[\]/);
  assert.match(schema, /insumos_associados\s+InsumoFornecedor\[\]/);
  assert.match(schema, /insumos_fornecedores\s+InsumoFornecedor\[\]/);
});

test('migration da Fase 3 troca somente o unique de insumos', () => {
  assert.match(finalMigrationName, /^\d{14}_update_insumo_unique$/);
  assert.match(
    finalMigration,
    /DROP INDEX `insumos_loja_id_nome_fornecedorId_key` ON `insumos`/,
  );
  assert.match(
    finalMigration,
    /CREATE UNIQUE INDEX `insumos_loja_id_nome_key`[\s\S]*\(`loja_id`, `nome`\)/,
  );
  assert.doesNotMatch(
    finalMigration,
    /^\s*(INSERT|UPDATE|DELETE|TRUNCATE|RENAME)\b/im,
  );
  assert.doesNotMatch(finalMigration, /DROP TABLE/i);
});

test('migration da Fase 1 e estritamente aditiva', () => {
  assert.match(migration, /CREATE TABLE `insumo_fornecedores`/);
  assert.doesNotMatch(
    migration,
    /^\s*(INSERT|UPDATE|DELETE|DROP|TRUNCATE|RENAME)\b/im,
  );

  const alteredTables = [...migration.matchAll(/ALTER TABLE `([^`]+)`/g)].map(
    (match) => match[1],
  );
  assert.ok(alteredTables.length >= 3);
  assert.deepEqual(new Set(alteredTables), new Set(['insumo_fornecedores']));
  assert.doesNotMatch(migration, /ALTER TABLE `insumos`/);
});

test('migration cria PK, indices e FKs esperadas', () => {
  for (const expected of [
    'PRIMARY KEY (`insumo_id`, `fornecedor_id`)',
    '`insumo_fornecedores_fornecedor_id_idx`',
    '`insumo_fornecedores_loja_id_insumo_id_idx`',
    '`insumo_fornecedores_loja_id_fornecedor_id_idx`',
    '`insumo_fornecedores_loja_id_fkey`',
    '`insumo_fornecedores_insumo_id_fkey`',
    '`insumo_fornecedores_fornecedor_id_fkey`',
  ]) {
    assert.ok(migration.includes(expected), `ausente: ${expected}`);
  }
});
