/**
 * Lista arquivos client com Bearer potencialmente cego (cookie-session).
 * Uso: node frontend/scripts/list-blind-bearer.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(__dirname, '../src');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const issues = [];
for (const f of walk(srcRoot)) {
  if (f.includes(`${path.sep}app${path.sep}api${path.sep}`)) continue;
  const raw = fs.readFileSync(f, 'utf8');
  if (!/getClientSessionToken/.test(raw)) continue;
  const src = stripComments(raw);

  const hasBearerToken =
    /Authorization\s*[:=]\s*`Bearer \$\{token\}`/.test(src) ||
    /Authorization\s*[:=]\s*`Bearer \$\{getClientSessionToken/.test(src) ||
    /headers\.Authorization\s*=\s*`Bearer \$\{token\}`/.test(src) ||
    /token\s*\?\s*\{\s*Authorization:\s*`Bearer \$\{token\}`/.test(src);

  if (!hasBearerToken) continue;

  const safeEverywhere =
    /buildClientAuthHeaders|sessionFetch/.test(src) &&
    !/token\s*\?\s*\{\s*Authorization:\s*`Bearer \$\{token\}`/.test(src) &&
    !(/if\s*\(\s*token\s*\)\s*headers\[['\"]Authorization['\"]\]\s*=/.test(src) &&
      !/isUsableBearerToken/.test(src));

  const usesIsUsable = /isUsableBearerToken\s*\(\s*token\s*\)/.test(src);
  const hasUnguardedTernary =
    /token\s*\?\s*\{\s*Authorization:\s*`Bearer \$\{token\}`/.test(src) &&
    !usesIsUsable;
  const hasUnguardedIf =
    /if\s*\(\s*token\s*\)[^\n]*\n[^\n]*Authorization/.test(src) ||
    /if\s*\(\s*token\s*\)\s*headers\[['\"]Authorization['\"]\]\s*=\s*`Bearer \$\{token\}`/.test(
      src,
    );
  const hasDirectBearer =
    /headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`/.test(src) ||
    /headers:\s*\{\s*Authorization:\s*`Bearer \$\{getClientSessionToken/.test(
      src,
    );

  const risky =
    hasUnguardedTernary ||
    (hasUnguardedIf && !usesIsUsable) ||
    (hasDirectBearer && !usesIsUsable && !/buildClientAuthHeaders/.test(src));

  if (risky || (!safeEverywhere && hasBearerToken && !usesIsUsable)) {
    issues.push(path.relative(srcRoot, f).split(path.sep).join('/'));
  }
}

console.log(JSON.stringify({ count: issues.length, issues }, null, 2));
