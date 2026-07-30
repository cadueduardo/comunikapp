/**
 * Auditoria residual: rotas BFF que ainda exigem Authorization sem cookie.
 * Uso: node frontend/scripts/audit-bff-auth.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../src/app/api');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name === 'route.ts') acc.push(p);
  }
  return acc;
}

const problems = [];
let withProxy = 0;
let withResolve = 0;

for (const file of walk(root)) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, path.dirname(file)).split(path.sep).join('/');
  if (src.includes('proxyBackend') || src.includes('resolveBackendAuth')) {
    if (src.includes('proxyBackend')) withProxy++;
    if (src.includes('resolveBackendAuth')) withResolve++;
    continue;
  }
  if (rel === 'auth/me' || rel.startsWith('auth/')) continue;
  if (/\/publico(\/|$)|\/public(\/|$)/.test(rel)) continue;

  const requiresAuthInline =
    /request\.headers\.get\(['"]authorization['"]\)/.test(src) &&
    /status:\s*401/.test(src);

  if (requiresAuthInline) {
    problems.push(rel);
  }
}

console.log(JSON.stringify({ withProxy, withResolve, problems }, null, 2));
