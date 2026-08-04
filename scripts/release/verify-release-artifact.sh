#!/usr/bin/env bash
set -euo pipefail

ARTIFACT=""
EXPECTED_SHA=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --artifact) ARTIFACT="$2"; shift 2 ;;
    --expected-sha) EXPECTED_SHA="$2"; shift 2 ;;
    *) echo "Uso: $0 --artifact ARQUIVO --expected-sha SHA" >&2; exit 2 ;;
  esac
done

fail() { echo "[verify-release] ERRO: $*" >&2; exit 1; }
[[ -n "$ARTIFACT" && -n "$EXPECTED_SHA" ]] || fail "artifact e expected-sha são obrigatórios."
[[ "$EXPECTED_SHA" =~ ^[0-9a-fA-F]{40}$ ]] || fail "expected-sha deve ter 40 caracteres hexadecimais."
EXPECTED_SHA="${EXPECTED_SHA,,}"
ARTIFACT="$(cd "$(dirname "$ARTIFACT")" && pwd)/$(basename "$ARTIFACT")"
[[ -f "$ARTIFACT" ]] || fail "tarball não encontrado: $ARTIFACT"

ARTIFACT_ROOT="$(dirname "$ARTIFACT")"
SUMS="$ARTIFACT_ROOT/SHA256SUMS"
[[ -f "$SUMS" ]] || fail "SHA256SUMS ausente: $SUMS"
(
  cd "$ARTIFACT_ROOT"
  sha256sum --check --status "$(basename "$SUMS")"
) || fail "checksum do artefato ou manifesto inválido."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
tar -xzf "$ARTIFACT" -C "$TMP"
require_file() { [[ -f "$1" ]] || fail "arquivo obrigatório ausente: ${1#"$TMP"/}"; }
require_file "$TMP/MANIFEST.json"
require_file "$TMP/backend/dist/main.js"
require_file "$TMP/frontend/.next/standalone/server.js"

MANIFEST_FOR_NODE="$TMP/MANIFEST.json"
if command -v cygpath >/dev/null 2>&1; then
  MANIFEST_FOR_NODE="$(cygpath -w "$MANIFEST_FOR_NODE")"
fi
node - "$MANIFEST_FOR_NODE" "$EXPECTED_SHA" <<'NODE'
const fs = require('fs');
const [manifestPath, expected] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.sha !== expected) {
  throw new Error(`SHA do manifesto divergente: ${manifest.sha || '(ausente)'}`);
}
if (!Array.isArray(manifest.files) || !manifest.files.length) {
  throw new Error('MANIFEST.json não contém files[].');
}
NODE

echo "[verify-release] artefato válido para $EXPECTED_SHA"
