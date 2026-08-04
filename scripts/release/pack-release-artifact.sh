#!/usr/bin/env bash
# Empacota somente artefatos já compilados. Não instala nem compila dependências.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SHA="${RELEASE_SHA:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --root) ROOT="$(cd "$2" && pwd)"; shift 2 ;;
    --sha) SHA="$2"; shift 2 ;;
    *) echo "Uso: $0 [--root DIRETORIO] [--sha SHA]" >&2; exit 2 ;;
  esac
done

fail() { echo "[pack-release] ERRO: $*" >&2; exit 1; }
require_file() { [[ -f "$1" ]] || fail "arquivo obrigatório ausente: $1"; }
require_dir() { [[ -d "$1" ]] || fail "diretório obrigatório ausente: $1"; }
node_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
  else
    printf '%s' "$1"
  fi
}

if [[ -z "$SHA" ]]; then
  SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null)" || fail "informe --sha fora de um checkout Git."
fi
[[ "$SHA" =~ ^[0-9a-fA-F]{40}$ ]] || fail "SHA deve ter 40 caracteres hexadecimais."
SHA="${SHA,,}"
SHORT_SHA="${SHA:0:12}"

BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
STANDALONE="$FRONTEND/.next/standalone"
require_file "$BACKEND/dist/main.js"
require_file "$BACKEND/prisma/schema.prisma"
require_dir "$BACKEND/prisma/migrations"
require_file "$BACKEND/package.json"
require_file "$BACKEND/package-lock.json"
require_dir "$BACKEND/node_modules"
require_dir "$BACKEND/node_modules/.prisma"
require_dir "$BACKEND/node_modules/@prisma/client"
require_file "$BACKEND/node_modules/.bin/prisma"
require_file "$BACKEND/scripts/mysql-backup-before-deploy.js"
require_file "$BACKEND/scripts/prisma-deploy-preflight.js"
require_file "$STANDALONE/server.js"
require_dir "$FRONTEND/.next/static"
require_file "$ROOT/ecosystem.release.config.js"

ARTIFACT_ROOT="$ROOT/artifacts/release"
RELEASE_DIR="$ARTIFACT_ROOT/$SHA"
TARBALL="$ARTIFACT_ROOT/comunikapp-release-$SHA.tar.gz"
SUMS="$ARTIFACT_ROOT/SHA256SUMS"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/backend" "$RELEASE_DIR/frontend/.next"

# O node_modules deve ter sido reduzido antes deste script (CI: npm prune --omit=dev).
cp -a "$BACKEND/dist" "$RELEASE_DIR/backend/dist"
cp -a "$BACKEND/prisma" "$RELEASE_DIR/backend/prisma"
cp -a "$BACKEND/package.json" "$BACKEND/package-lock.json" "$RELEASE_DIR/backend/"
cp -a "$BACKEND/node_modules" "$RELEASE_DIR/backend/node_modules"
mkdir -p "$RELEASE_DIR/backend/scripts"
cp -a "$BACKEND/scripts/mysql-backup-before-deploy.js" "$BACKEND/scripts/prisma-deploy-preflight.js" "$RELEASE_DIR/backend/scripts/"
cp -a "$STANDALONE" "$RELEASE_DIR/frontend/.next/standalone"
mkdir -p "$RELEASE_DIR/frontend/.next/standalone/.next"
cp -a "$FRONTEND/.next/static" "$RELEASE_DIR/frontend/.next/standalone/.next/static"
if [[ -d "$FRONTEND/public" ]]; then
  cp -a "$FRONTEND/public" "$RELEASE_DIR/frontend/.next/standalone/public"
fi
cp -a "$ROOT/ecosystem.release.config.js" "$RELEASE_DIR/ecosystem.release.config.js"

NODE_VERSION="$(node --version)"
NPM_VERSION="$(npm --version)"
export BACKEND_FOR_NODE="$(node_path "$BACKEND")"
export FRONTEND_FOR_NODE="$(node_path "$FRONTEND")"
PRISMA_VERSION="$(node -p "require(process.env.BACKEND_FOR_NODE + '/node_modules/prisma/package.json').version" 2>/dev/null || true)"
[[ -n "$PRISMA_VERSION" ]] || PRISMA_VERSION="$(node -p "require(process.env.BACKEND_FOR_NODE + '/node_modules/@prisma/client/package.json').version")"
NEXT_VERSION="$(node -p "require(process.env.FRONTEND_FOR_NODE + '/node_modules/next/package.json').version")"
SHARP_VERSION="$(node -p "require(process.env.BACKEND_FOR_NODE + '/node_modules/sharp/package.json').version")"
BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

export RELEASE_DIR_FOR_NODE="$(node_path "$RELEASE_DIR")"
export SHA SHORT_SHA BUILT_AT NODE_VERSION NPM_VERSION PRISMA_VERSION NEXT_VERSION SHARP_VERSION
node <<'NODE'
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = process.env.RELEASE_DIR_FOR_NODE;
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(file);
    if (!entry.isFile()) return [];
    const relative = path.relative(root, file).split(path.sep).join('/');
    return [{ path: relative, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') }];
  });
}
const manifest = {
  sha: process.env.SHA,
  shortSha: process.env.SHORT_SHA,
  builtAt: process.env.BUILT_AT,
  nodeVersion: process.env.NODE_VERSION,
  npmVersion: process.env.NPM_VERSION,
  prismaVersion: process.env.PRISMA_VERSION,
  packages: { next: process.env.NEXT_VERSION, sharp: process.env.SHARP_VERSION },
  auditsSummary: {
    baseline: 'passed in CI job npm-audit-baseline',
    baselinePath: 'scripts/security/npm-audit-baseline.json',
  },
  files: walk(root).sort((a, b) => a.path.localeCompare(b.path)),
};
fs.writeFileSync(path.join(root, 'MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
NODE

rm -f "$TARBALL" "$SUMS"
tar -C "$RELEASE_DIR" -czf "$TARBALL" .
(
  cd "$ARTIFACT_ROOT"
  sha256sum "$(basename "$TARBALL")" "$SHA/MANIFEST.json" > "$(basename "$SUMS")"
)

echo "[pack-release] release criada: $RELEASE_DIR"
echo "[pack-release] tarball: $TARBALL"
