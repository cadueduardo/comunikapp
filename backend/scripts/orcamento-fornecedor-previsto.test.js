const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');

const raiz = resolve(__dirname, '..', '..');
const ler = (...partes) => readFileSync(resolve(raiz, ...partes), 'utf8');

test('migration é aditiva, mantém histórico nulo e preserva snapshot ao excluir fornecedor', () => {
  const migration = ler(
    'backend',
    'prisma',
    'migrations',
    '20260718165000_add_fornecedor_previsto_item_insumo',
    'migration.sql',
  );

  assert.match(migration, /fornecedor_previsto_id.*NULL/i);
  assert.match(migration, /fornecedor_nome_snapshot.*NULL/i);
  assert.match(migration, /preco_compra_snapshot.*NULL/i);
  assert.match(migration, /ON DELETE SET NULL/i);
  assert.doesNotMatch(
    migration,
    /^\s*(DROP\b|DELETE\s+FROM\b|UPDATE\s+`|TRUNCATE\b)/im,
  );
});

test('backend resolve fornecedor dentro da loja e substitui preços enviados pelo cliente', () => {
  const service = ler(
    'backend',
    'src',
    'orcamentos-v2',
    'services',
    'orcamentos-v2.service.ts',
  );

  assert.match(service, /loja_id:\s*lojaId/);
  assert.match(service, /fornecedores_associados\.find\(\(item\) => item\.padrao\)/);
  assert.match(service, /material\.preco_compra_snapshot = precoCompra/);
  assert.match(service, /material\.preco_unitario = precoUnitario/);
  assert.match(service, /material\.fornecedor_nome_snapshot = associacao\.fornecedor\.nome/);
});

test('comparação rápida usa a matriz ativa e limita a resposta a três opções', () => {
  const service = ler('backend', 'src', 'insumos', 'insumos.service.ts');
  const componente = ler(
    'frontend',
    'src',
    'components',
    'orcamentos-v2',
    'FornecedorPrevistoMaterial.tsx',
  );

  assert.match(service, /const top = associacoes\.slice\(0,\s*3\)/);
  assert.match(service, /TipoFornecedor\.INSUMO,\s*TipoFornecedor\.AMBOS/);
  assert.match(componente, /Comparar fornecedores/);
  assert.match(componente, /O padrão global do\s+insumo não será alterado/);
  assert.doesNotMatch(componente, /\sstyle\s*=/);
});

test('campos da fotografia atravessam a validação do formulário', () => {
  const schema = ler(
    'frontend',
    'src',
    'components',
    'ui',
    'orcamento',
    'schemas',
    'orcamento.schema.ts',
  );

  for (const campo of [
    'item_insumo_id',
    'fornecedor_previsto_id',
    'fornecedor_nome_snapshot',
    'codigo_ref_snapshot',
    'preco_compra_snapshot',
    'preco_unitario_previsto',
  ]) {
    assert.match(schema, new RegExp(`${campo}:`));
  }
});
