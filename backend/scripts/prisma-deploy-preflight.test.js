const assert = require('node:assert/strict');
const test = require('node:test');

const {
  findMissingColumns,
  legacyReconciliationRequirements,
} = require('./prisma-deploy-preflight');

test('não antecipa colunas criadas pela migration workflow_por_item', () => {
  const requirements = legacyReconciliationRequirements([
    'workflow_instancia_setor',
  ]);
  const columns = requirements.get('workflow_instancia_setor');

  assert.ok(columns.includes('workflow_instancia_id'));
  assert.ok(columns.includes('setor_id'));
  assert.ok(!columns.includes('loja_id'));
  assert.ok(!columns.includes('workflow_id'));
});

test('continua bloqueando coluna realmente ausente no baseline legado', () => {
  const requirements = legacyReconciliationRequirements([
    'workflow_instancia_setor',
  ]);
  const existing = new Set(
    requirements
      .get('workflow_instancia_setor')
      .filter((column) => column !== 'setor_id'),
  );

  assert.deepEqual(
    findMissingColumns(
      new Map([['workflow_instancia_setor', existing]]),
      requirements,
    ),
    ['workflow_instancia_setor.setor_id'],
  );
});
