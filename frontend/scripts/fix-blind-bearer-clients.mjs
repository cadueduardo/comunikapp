/**
 * Corrige padrões legados Authorization: Bearer ${token} (cookie-session)
 * para buildClientAuthHeaders + credentials: 'include'.
 *
 * Uso: node frontend/scripts/fix-blind-bearer-clients.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, '../src');
const write = process.argv.includes('--write');

const TARGETS = [
  'app/(main)/centros-de-trabalho/setores-produtivos/editar/[id]/page.tsx',
  'app/(main)/configuracoes/arte-aprovacao/page.tsx',
  'app/(main)/configuracoes/custos-indiretos/custo-indireto-form.tsx',
  'app/(main)/estoque/itens/editar/[id]/page.tsx',
  'app/(main)/estoque/lotes/[id]/editar/page.tsx',
  'app/(main)/estoque/lotes/[id]/page.tsx',
  'app/(main)/estoque/movimentacoes/ajuste/page.tsx',
  'app/(main)/estoque/movimentacoes/entrada/page.tsx',
  'app/(main)/estoque/movimentacoes/saida/page.tsx',
  'app/(main)/estoque/sobras/page.tsx',
  'app/(main)/pcp/workflows/novo/page.tsx',
  'app/(main)/pcp/workflows/[id]/editar/page.tsx',
  'components/arte-aprovacao/ArteWorkspacePanel.tsx',
  'components/instalacao/AnexoInstalacaoImagem.tsx',
  'components/os/arte-aprovacao/components/ArteReferenciaOrcamentoPanel.tsx',
  'components/os/arte-aprovacao/components/ArteResumoOsPanel.tsx',
  'components/pcp/WorkflowAssignmentDialog.tsx',
  'components/produtos-finitos/ProdutoFinitoThumb.tsx',
  'components/ui/produto/hooks/useProdutoData.ts',
  'lib/conexoes-api.ts',
  'lib/financeiro-api.ts',
  'lib/arte-fila-api.ts',
  'lib/arte-orcamento-api.ts',
  'app/(main)/configuracoes/maquinas/maquina-form.tsx',
  'app/(main)/centros-de-trabalho/servicos/novo/servico-manual-form.tsx',
  'app/(main)/configuracoes/funcoes/funcao-form.tsx',
  'components/forms/ct/MaquinaForm.tsx',
  'components/orcamentos-v2/AnexoGeometriaInput.tsx',
  'components/os/arte-aprovacao/components/ArteCreateVersionModal.tsx',
  'components/os/arte-aprovacao/components/ArteFileUpload.tsx',
  'components/os/arte-aprovacao/components/ArteFileUploadMultiple.tsx',
  'hooks/use-websocket.ts',
];

function ensureImport(src, names) {
  const want = new Set(names);
  const importRe =
    /import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/session-auth['"]\s*;?/;
  const m = src.match(importRe);
  if (m) {
    const existing = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const n of existing) want.add(n.replace(/\s+as\s+\w+$/, ''));
    const merged = [...want].sort().join(', ');
    return src.replace(importRe, `import { ${merged} } from '@/lib/session-auth';`);
  }
  if (src.startsWith("'use client'") || src.startsWith('"use client"')) {
    return src.replace(
      /^['"]use client['"];?\r?\n/,
      (line) =>
        `${line}import { ${[...want].sort().join(', ')} } from '@/lib/session-auth';\n`,
    );
  }
  return `import { ${[...want].sort().join(', ')} } from '@/lib/session-auth';\n${src}`;
}

function transform(src) {
  let out = src;
  const before = out;

  out = out.replace(
    /headers\s*:\s*\{\s*(?:'Authorization'|"Authorization"|Authorization)\s*:\s*`Bearer \$\{token\}`\s*,?\s*(?:'Content-Type'|"Content-Type"|Content-Type)\s*:\s*['"]application\/json['"]\s*,?\s*\}/g,
    `headers: buildClientAuthHeaders({ 'Content-Type': 'application/json' }),\n        credentials: 'include'`,
  );
  out = out.replace(
    /headers\s*:\s*\{\s*(?:'Content-Type'|"Content-Type"|Content-Type)\s*:\s*['"]application\/json['"]\s*,\s*(?:'Authorization'|"Authorization"|Authorization)\s*:\s*`Bearer \$\{token\}`\s*,?\s*\}/g,
    `headers: buildClientAuthHeaders({ 'Content-Type': 'application/json' }),\n        credentials: 'include'`,
  );
  out = out.replace(
    /headers\s*:\s*\{\s*(?:'Authorization'|"Authorization"|Authorization)\s*:\s*`Bearer \$\{token\}`\s*,?\s*\}/g,
    `headers: buildClientAuthHeaders(),\n        credentials: 'include'`,
  );
  out = out.replace(
    /headers\s*:\s*token\s*\?\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*:\s*\{\s*\}/g,
    `headers: buildClientAuthHeaders(),\n        credentials: 'include'`,
  );
  out = out.replace(
    /headers\s*:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*,/g,
    `headers: buildClientAuthHeaders(),\n        credentials: 'include',`,
  );

  // if (token) headers['Authorization'] = `Bearer ${token}`;
  out = out.replace(
    /if\s*\(\s*token\s*\)\s*headers\[['\"]Authorization['\"]\]\s*=\s*`Bearer \$\{token\}`\s*;?/g,
    `Object.assign(headers, buildClientAuthHeaders());`,
  );
  out = out.replace(
    /if\s*\(\s*token\s*\)\s*\{\s*headers\[['\"]Authorization['\"]\]\s*=\s*`Bearer \$\{token\}`\s*;?\s*\}/g,
    `Object.assign(headers, buildClientAuthHeaders());`,
  );
  out = out.replace(
    /if\s*\(\s*isUsableBearerToken\(\s*token\s*\)\s*\)\s*\{\s*headers\.Authorization\s*=\s*`Bearer \$\{token\}`\s*;?\s*\}/g,
    `Object.assign(headers, buildClientAuthHeaders());`,
  );
  out = out.replace(
    /if\s*\(\s*isUsableBearerToken\(\s*token\s*\)\s*\)\s*headers\.Authorization\s*=\s*`Bearer \$\{token\}`\s*;?/g,
    `Object.assign(headers, buildClientAuthHeaders());`,
  );

  // const headers = { Authorization: `Bearer ${token}` };
  out = out.replace(
    /const headers = \{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*;/g,
    `const headers = buildClientAuthHeaders();`,
  );

  out = out.replace(
    /credentials:\s*['"]include['"]\s*,\s*credentials:\s*['"]include['"]/g,
    `credentials: 'include'`,
  );
  out = out.replace(
    /credentials:\s*['"]include['"]\s*\n\s*credentials:\s*['"]include['"]/g,
    `credentials: 'include'`,
  );

  if (out === before) {
    return { out, changed: false };
  }

  out = ensureImport(out, ['buildClientAuthHeaders']);
  return { out, changed: true };
}

const report = [];
for (const rel of TARGETS) {
  const file = path.join(srcRoot, rel);
  if (!fs.existsSync(file)) {
    report.push({ rel, status: 'missing' });
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  const { out, changed } = transform(src);
  if (!changed) {
    report.push({ rel, status: 'unchanged' });
    continue;
  }
  if (write) fs.writeFileSync(file, out, 'utf8');
  report.push({ rel, status: write ? 'written' : 'would_write' });
}

console.log(JSON.stringify(report, null, 2));
