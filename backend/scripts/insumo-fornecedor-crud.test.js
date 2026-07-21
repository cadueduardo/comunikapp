const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const read = (...parts) =>
  fs.readFileSync(path.join(...parts), { encoding: 'utf8' });

const dto = read(
  backendRoot,
  'src',
  'insumos',
  'dto',
  'vincular-fornecedores.dto.ts',
);
const updateDto = read(
  backendRoot,
  'src',
  'insumos',
  'dto',
  'update-insumo.dto.ts',
);
const service = read(
  backendRoot,
  'src',
  'insumos',
  'insumos.service.ts',
);
const supplierService = read(
  backendRoot,
  'src',
  'fornecedores',
  'fornecedores.service.ts',
);
const matrixComponent = read(
  repoRoot,
  'frontend',
  'src',
  'app',
  '(main)',
  'insumos',
  'editar',
  '[id]',
  'matriz-fornecedores-card.tsx',
);

test('DTO limita envelope, tamanho e campos da matriz', () => {
  for (const expected of [
    '@ArrayMinSize(1)',
    '@ArrayMaxSize(100)',
    '@ValidateNested({ each: true })',
    '@MaxLength(64)',
    '@MaxLength(191)',
    '@IsNumber({ maxDecimalPlaces: 2 })',
  ]) {
    assert.ok(dto.includes(expected), `ausente: ${expected}`);
  }
});

test('update geral omite fornecedor e custo', () => {
  assert.match(
    updateDto,
    /OmitType\(CreateInsumoDto,[\s\S]*'fornecedorId'[\s\S]*'custo_unitario'/,
  );
});

test('backend cria e substitui matriz dentro de transacoes tenant-aware', () => {
  assert.match(
    service,
    /tx\.insumoFornecedor\.create\([\s\S]*loja_id: loja\.id[\s\S]*padrao: true/,
  );
  assert.match(
    service,
    /async vincularFornecedores\([\s\S]*this\.prisma\.\$transaction/,
  );
  assert.match(
    service,
    /tx\.fornecedor\.findMany\([\s\S]*loja_id: loja\.id[\s\S]*ativo: true/,
  );
  assert.match(
    service,
    /tx\.insumoFornecedor\.deleteMany\([\s\S]*loja_id: loja\.id/,
  );
  assert.match(
    service,
    /tx\.insumo\.update\([\s\S]*fornecedorId: padrao\.fornecedor_id[\s\S]*custo_unitario: padrao\.preco_custo/,
  );
});

test('importacao e duplicacao reutilizam o create que cria a matriz inicial', () => {
  const createCalls = service.match(/return this\.create\(dto, loja\)|await this\.create\(dto, loja\)/g) ?? [];
  assert.ok(
    createCalls.length >= 2,
    'importacao e duplicacao devem passar pelo create centralizado',
  );
});

test('guards de fornecedor consideram qualquer vinculo da matriz', () => {
  assert.match(
    supplierService,
    /dto\.ativo === false \|\| dto\.tipo === TipoFornecedor\.TERCEIRIZADO/,
  );
  assert.match(
    supplierService,
    /tx\.insumoFornecedor\.count\([\s\S]*fornecedor_id: id[\s\S]*loja_id: lojaAtual\.id/,
  );
  assert.match(
    supplierService,
    /this\.prisma\.insumoFornecedor\.findMany\([\s\S]*fornecedor_id: id[\s\S]*loja_id: lojaAtual\.id/,
  );
});

test('componente usa design system e nao possui style inline', () => {
  assert.match(matrixComponent, /from '@\/components\/ui\/card'/);
  assert.match(matrixComponent, /from '@\/components\/ui\/button'/);
  assert.match(matrixComponent, /insumosApi\.vincularFornecedores/);
  assert.doesNotMatch(matrixComponent, /\sstyle=\{/);
  assert.doesNotMatch(matrixComponent, /Salvar matriz/);
  assert.match(matrixComponent, /persistMatrix|gravadas automaticamente/);
});
