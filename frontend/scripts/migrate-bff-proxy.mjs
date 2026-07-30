/**
 * Migra rotas BFF legadas (Bearer-only) para proxyBackend.
 * Uso: node frontend/scripts/migrate-bff-proxy.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../src/app/api');

const SKIP_REL = [
  /^auth(\/|$)/,
  /\/upload(\/|$)/,
  /export\.csv/,
  /imprimir/,
  /google\/auth/,
  /anexos\/\[token\]/,
  /relatorios\/\[token\]/,
  /\/publico(\/|$)/,
  /\/public(\/|$)/,
];

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === 'route.ts') acc.push(p);
  }
  return acc;
}

function extractMethods(src) {
  return [...src.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)].map(
    (m) => m[1],
  );
}

function extractParamNames(rel) {
  return [...rel.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
}

function backendPathExpr(rel) {
  // "/pcp/kanban/mover-setor/${encodeURIComponent(itemOsId)}"
  const parts = rel.split('/').map((seg) => {
    const m = seg.match(/^\[(.+)\]$/);
    if (m) return `\${encodeURIComponent(${m[1]})}`;
    return seg;
  });
  return '`/' + parts.join('/') + '`';
}

function generateRoute(rel, methods) {
  const params = extractParamNames(rel);
  const pathExpr = backendPathExpr(rel);
  const hasBodyMethods = methods.some((m) =>
    ['POST', 'PUT', 'PATCH'].includes(m),
  );

  const lines = [
    "import { NextRequest } from 'next/server';",
    "import { proxyBackend } from '@/lib/api/proxy-backend';",
    '',
  ];

  if (params.length > 0) {
    const typeFields = params.map((p) => `${p}: string`).join('; ');
    for (const method of methods) {
      const needsBody = ['POST', 'PUT', 'PATCH'].includes(method);
      lines.push(`export async function ${method}(`);
      lines.push(`  request: NextRequest,`);
      lines.push(`  { params }: { params: Promise<{ ${typeFields} }> },`);
      lines.push(`) {`);
      lines.push(`  const { ${params.join(', ')} } = await params;`);
      if (needsBody) {
        lines.push(`  const body = await request.text();`);
        lines.push(`  return proxyBackend(request, ${pathExpr}, {`);
        lines.push(`    method: '${method}',`);
        lines.push(`    body: body || undefined,`);
        lines.push(`  });`);
      } else if (method === 'DELETE') {
        lines.push(`  return proxyBackend(request, ${pathExpr}, { method: 'DELETE' });`);
      } else {
        lines.push(`  return proxyBackend(request, ${pathExpr});`);
      }
      lines.push(`}`);
      lines.push('');
    }
  } else {
    for (const method of methods) {
      const needsBody = ['POST', 'PUT', 'PATCH'].includes(method);
      lines.push(`export async function ${method}(request: NextRequest) {`);
      if (needsBody) {
        lines.push(`  const body = await request.text();`);
        lines.push(`  return proxyBackend(request, ${pathExpr}, {`);
        lines.push(`    method: '${method}',`);
        lines.push(`    body: body || undefined,`);
        lines.push(`  });`);
      } else if (method === 'DELETE') {
        lines.push(`  return proxyBackend(request, ${pathExpr}, { method: 'DELETE' });`);
      } else {
        lines.push(`  return proxyBackend(request, ${pathExpr});`);
      }
      lines.push(`}`);
      lines.push('');
    }
  }

  void hasBodyMethods;
  return lines.join('\n').trimEnd() + '\n';
}

const files = walk(root);
const report = { migrated: [], skipped: [], already: 0, noAuth: 0 };

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('proxyBackend')) {
    report.already++;
    continue;
  }
  if (
    !/authorization|authHeader|obterAuthHeader|Token de autoriza|Token n[aã]o fornecido/i.test(
      src,
    )
  ) {
    report.noAuth++;
    continue;
  }

  const rel = path.relative(root, path.dirname(file)).split(path.sep).join('/');
  if (SKIP_REL.some((re) => re.test(rel)) || /formData\(|\.blob\(|arrayBuffer\(/i.test(src)) {
    report.skipped.push(rel);
    continue;
  }

  const methods = extractMethods(src);
  if (methods.length === 0) {
    report.skipped.push(rel + ' (sem methods)');
    continue;
  }

  // Segurança: se o arquivo usa path backend claramente diferente do folder, pular
  const folderPrefix = '/' + rel.split('/')[0];
  const apiCalls = [
    ...src.matchAll(/buildApiUrl\(([`'"])([^`'"]+)\1\)/g),
  ].map((m) => m[2]);
  const weird = apiCalls.filter(
    (p) => p && !p.startsWith(folderPrefix) && !p.startsWith('`/' + rel.split('/')[0]),
  );
  // template literals with ${} — buildApiUrl(`/x/${id}`) captured partially
  // Also check BACKEND_URL concatenations
  if (weird.length > 0) {
    // Still OK if it's just absolute path matching module
    const reallyWeird = weird.filter((p) => !p.includes(rel.split('/')[0]));
    if (reallyWeird.length > 0) {
      report.skipped.push(rel + ' (path mismatch: ' + reallyWeird.join(',') + ')');
      continue;
    }
  }

  const next = generateRoute(rel, methods);
  fs.writeFileSync(file, next, 'utf8');
  report.migrated.push(rel + ' [' + methods.join(',') + ']');
}

console.log(JSON.stringify(report, null, 2));
console.log(
  `\nMigradas: ${report.migrated.length} | Skip: ${report.skipped.length} | Já proxy: ${report.already}`,
);
