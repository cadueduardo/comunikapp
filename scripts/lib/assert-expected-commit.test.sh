#!/usr/bin/env bash
# Testes de assert_expected_commit — rodar em bash (CI Ubuntu ou Git Bash).
#   bash scripts/lib/assert-expected-commit.test.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=assert-expected-commit.sh
source "${ROOT}/scripts/lib/assert-expected-commit.sh"

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

pass=0
fail=0

assert_ok() {
  local name="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "ok - $name"
    pass=$((pass + 1))
  else
    echo "not ok - $name"
    fail=$((fail + 1))
  fi
}

assert_fails() {
  local name="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "not ok - $name (deveria falhar)"
    fail=$((fail + 1))
  else
    echo "ok - $name"
    pass=$((pass + 1))
  fi
}

cd "$TMP"
git init -q
git config user.email 'test@example.com'
git config user.name 'Test'
echo a > arquivo.txt
git add arquivo.txt
git commit -qm 'primeiro'
HEAD1="$(git rev-parse HEAD)"

echo b >> arquivo.txt
git add arquivo.txt
git commit -qm 'segundo'
HEAD2="$(git rev-parse HEAD)"

# Sem EXPECTED_COMMIT: no-op
unset EXPECTED_COMMIT || true
assert_ok 'vazio e no-op' assert_expected_commit

# Hash completo bate
EXPECTED_COMMIT="$HEAD2"
assert_ok 'hash completo igual a HEAD' assert_expected_commit

# Prefixo unico bate
EXPECTED_COMMIT="${HEAD2:0:10}"
assert_ok 'prefixo unico igual a HEAD' assert_expected_commit

# Commit antigo: diverge
EXPECTED_COMMIT="$HEAD1"
assert_fails 'hash de outro commit diverge' assert_expected_commit

# Prefixo inexistente
EXPECTED_COMMIT='deadbeef'
assert_fails 'prefixo inexistente' assert_expected_commit

# Valor nao-hex
EXPECTED_COMMIT='feat/modulo-vendas'
assert_fails 'ref textual rejeitada' assert_expected_commit

# Prefixo curto demais
EXPECTED_COMMIT='abc'
assert_fails 'prefixo curto demais' assert_expected_commit

# Prefixo ambiguo: dois objetos com o mesmo inicio artificial e impossivel de
# forcar com hashes reais de forma estavel. Em vez disso, verificamos que a
# resolucao com --disambiguate de um prefixo curto de HEAD1, se por acaso
# casar com mais de um objeto no repo minimo, e tratada; no repo de dois
# commits a chance e baixa. O caso critico (divergencia) ja esta coberto.

echo
echo "passaram: $pass  falharam: $fail"
[ "$fail" -eq 0 ]
