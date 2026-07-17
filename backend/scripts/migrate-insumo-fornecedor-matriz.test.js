const assert = require('node:assert/strict');
const test = require('node:test');

const {
  analyzeJson,
  assertReadOnlySql,
  buildReport,
  normalizeForJson,
  parseArgs,
  selectSurvivor,
  survivorReason,
} = require('./migrate-insumo-fornecedor-matriz');

test('dry-run e o padrao e --apply e sempre bloqueado', () => {
  assert.equal(parseArgs([]).writeReports, true);
  assert.equal(parseArgs(['--dry-run', '--loja-id=loja-1']).lojaId, 'loja-1');
  assert.throws(() => parseArgs(['--apply']), /nao e suportado/);
  assert.throws(() => parseArgs(['--apply=true']), /nao e suportado/);
  assert.throws(() => parseArgs(['--desconhecido']), /Argumento desconhecido/);
});

test('guard aceita SELECT e bloqueia escrita ou DDL', () => {
  assert.doesNotThrow(() => assertReadOnlySql('SELECT * FROM insumos'));
  assert.doesNotThrow(() =>
    assertReadOnlySql('/* inventario */ SELECT id FROM insumos'),
  );
  for (const sql of [
    'UPDATE insumos SET ativo = 0',
    'INSERT INTO insumos (id) VALUES ("x")',
    'DELETE FROM insumos',
    'CREATE TABLE teste (id INT)',
    'SELECT 1; DROP TABLE insumos',
  ]) {
    assert.throws(() => assertReadOnlySql(sql), /bloqueada|bloqueado/);
  }
});

test('sobrevivente prioriza ativo, estoque, antiguidade e ID', () => {
  const base = {
    criado_em: '2025-01-01T00:00:00.000Z',
    estoque_total: 0,
  };
  const candidates = [
    { ...base, id: 'a', ativo: false, estoque_total: 100 },
    { ...base, id: 'd', ativo: true, estoque_total: 5 },
    { ...base, id: 'c', ativo: true, estoque_total: 10 },
    { ...base, id: 'b', ativo: true, estoque_total: 10 },
  ];
  assert.equal(selectSurvivor(candidates).id, 'b');
  assert.equal(survivorReason(candidates, candidates[3]), 'ativo=true');
});

test('analise JSON encontra IDs conhecidos, shapes estranhos e JSON invalido', () => {
  const ids = new Set(['sec-1']);
  const known = analyzeJson(
    JSON.stringify([{ insumo_id: 'sec-1', quantidade: 2 }]),
    ids,
  );
  assert.equal(known.valid, true);
  assert.equal(known.occurrences.length, 1);
  assert.equal(known.unknownShapes.length, 0);

  const unknown = analyzeJson(JSON.stringify({ material: 'sec-1' }), ids);
  assert.equal(unknown.occurrences.length, 1);
  assert.equal(unknown.unknownShapes.length, 1);

  const invalid = analyzeJson('{', ids);
  assert.equal(invalid.valid, false);
});

test('buildReport usa apenas leitura e inclui loja sem colisao', async () => {
  const queries = [];
  const prisma = {
    async $queryRawUnsafe(sql) {
      queries.push(sql);
      if (sql.includes('information_schema.TABLES')) {
        return [
          { table_name: 'insumos' },
          { table_name: 'fornecedor' },
          { table_name: 'estoque_itens' },
        ];
      }
      if (sql.includes('COUNT(*) AS total_insumos')) {
        return [{ loja_id: 'loja-1', total_insumos: 3n }];
      }
      if (sql.includes('duplicate_groups.representative_id')) return [];
      throw new Error(`Query inesperada: ${sql}`);
    },
    async $executeRawUnsafe() {
      throw new Error('escrita nao deveria ser chamada');
    },
  };

  const report = await buildReport(prisma, {
    lojaId: null,
    writeReports: false,
  });

  assert.equal(report.summary.lojas, 1);
  assert.equal(report.summary.grupos, 0);
  assert.equal(report.summary.estimated_operations.inserts, 3);
  assert.equal(report.lojas[0].loja_id, 'loja-1');
  assert.equal(report.lojas[0].grupos.length, 0);
  const serialized = JSON.stringify(report, normalizeForJson);
  assert.equal(JSON.parse(serialized).summary.estimated_operations.inserts, 3);
  queries.forEach(assertReadOnlySql);
});

test('serializador converte BigInt sem esvaziar o documento', () => {
  const serialized = JSON.stringify({ total: 3n }, normalizeForJson);
  assert.deepEqual(JSON.parse(serialized), { total: 3 });
});
