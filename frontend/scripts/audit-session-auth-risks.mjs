/**
 * Audita riscos de auth pós-cookie HttpOnly:
 * 1) BFF sem proxyBackend/resolveBackendAuth que ainda fala com o Nest
 * 2) Clients que mandam Authorization: Bearer ${getClientSessionToken()} sem isUsableBearerToken
 * 3) Clients com Bearer e sem credentials: 'include' no mesmo bloco
 *
 * Uso: node frontend/scripts/audit-session-auth-risks.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, '../src/app/api');
const srcRoot = path.resolve(__dirname, '../src');

function walk(dir, pred, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, acc);
    else if (pred(e.name)) acc.push(p);
  }
  return acc;
}

function relApi(f) {
  return path.relative(apiRoot, path.dirname(f)).split(path.sep).join('/');
}
function relSrc(f) {
  return path.relative(srcRoot, f).split(path.sep).join('/');
}

const bffSkip = /^(auth(\/|$)|public(\/|$)|gestao\/auth)/;
const bffNoProxy = [];
for (const f of walk(apiRoot, (n) => n === 'route.ts')) {
  const rel = relApi(f);
  if (bffSkip.test(rel)) continue;
  const src = fs.readFileSync(f, 'utf8');
  const usesProxy =
    /proxyBackend|proxyAdminBackend|resolveBackendAuth/.test(src);
  const hitsBackend =
    /buildApiUrl|fetch\(|BACKEND_URL|localhost:4000|NEXT_PUBLIC_API|NEXT_PUBLIC_BACKEND/.test(
      src,
    );
  if (!usesProxy && hitsBackend) bffNoProxy.push(rel);
}

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const blindBearer = [];
const bearerWithoutCredentials = [];
for (const f of walk(srcRoot, (n) => /\.(ts|tsx)$/.test(n))) {
  if (f.includes(`${path.sep}app${path.sep}api${path.sep}`)) continue;
  const raw = fs.readFileSync(f, 'utf8');
  if (!/getClientSessionToken/.test(raw)) continue;
  if (!/Authorization/.test(raw)) continue;
  const src = stripComments(raw);

  const usesGuard =
    /isUsableBearerToken|buildClientAuthHeaders|sessionFetch/.test(src);
  const hasBlind =
    /Authorization['"`]\s*:\s*`Bearer \$\{token\}`/.test(src) ||
    /Authorization['"`]\s*:\s*`Bearer \$\{getClientSessionToken/.test(src) ||
    /'Authorization':\s*`Bearer \$\{token\}`/.test(src) ||
    /"Authorization":\s*`Bearer \$\{token\}`/.test(src) ||
    /headers\.Authorization\s*=\s*`Bearer \$\{token\}`/.test(src) ||
    /token\s*\?\s*\{\s*Authorization:\s*`Bearer \$\{token\}`/.test(src);

  if (hasBlind && !usesGuard) {
    blindBearer.push(relSrc(f));
  }

  if (
    hasBlind &&
    !/credentials:\s*['"]include['"]/.test(src) &&
    !/apiRequest\(|apiFetch\(|sessionFetch\(/.test(src)
  ) {
    bearerWithoutCredentials.push(relSrc(f));
  }
}

console.log(
  JSON.stringify(
    {
      bffNoProxy,
      bffNoProxyCount: bffNoProxy.length,
      blindBearerCount: blindBearer.length,
      blindBearer,
      bearerWithoutCredentialsCount: bearerWithoutCredentials.length,
      bearerWithoutCredentials,
    },
    null,
    2,
  ),
);
