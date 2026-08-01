#!/usr/bin/env bash
# Ensaios do entrypoint run-deploy-from-expected-commit (sem deploy real).
#   bash scripts/run-deploy-from-expected-commit.test.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

pass=0
fail=0

ok() { echo "ok - $1"; pass=$((pass + 1)); }
nok() { echo "not ok - $1"; fail=$((fail + 1)); }

# Repo minimo com os tres arquivos do archive.
REPO="$TMP/repo"
mkdir -p "$REPO/scripts/lib"
cp "$ROOT/scripts/run-deploy-from-expected-commit.sh" "$REPO/scripts/"
cp "$ROOT/scripts/deploy-vps-branch-atual.sh" "$REPO/scripts/"
cp "$ROOT/scripts/lib/assert-expected-commit.sh" "$REPO/scripts/lib/"
# Stub do deploy para o entrypoint nao rodar o deploy real neste teste.
cat > "$REPO/scripts/deploy-vps-branch-atual.sh" <<'EOF'
#!/usr/bin/env bash
echo "DEPLOY_STUB_OK expected=${EXPECTED_COMMIT}"
exit 0
EOF

cd "$REPO"
git init -q
git config user.email 'test@example.com'
git config user.name 'Test'
git add scripts
git commit -qm 'artefato'
COMMIT="$(git rev-parse HEAD)"
git branch -M feat/modulo-vendas
git remote add origin "$REPO"
git update-ref refs/remotes/origin/feat/modulo-vendas "$COMMIT"

EXTRACT="$TMP/extract"
mkdir -p "$EXTRACT"
git archive "$COMMIT" \
  scripts/run-deploy-from-expected-commit.sh \
  scripts/deploy-vps-branch-atual.sh \
  scripts/lib/assert-expected-commit.sh \
  | tar -x -C "$EXTRACT"

# Conta arquivos extraidos (somente os tres caminhos).
count="$(find "$EXTRACT" -type f | wc -l | tr -d ' ')"
if [ "$count" = '3' ]; then
  ok "archive extrai exatamente 3 arquivos"
else
  nok "archive extraiu ${count} arquivos (esperado 3)"
fi

# Tip remoto bate → entrypoint chega ao stub.
out="$(
  PROJECT_DIR="$REPO" \
  BRANCH=feat/modulo-vendas \
  EXPECTED_COMMIT="$COMMIT" \
  ALLOW_NON_TMP_DEPLOY_EXTRACT=1 \
  bash "$EXTRACT/scripts/run-deploy-from-expected-commit.sh" 2>&1 || true
)"
# EXTRACT esta sob /tmp no Linux; no Git Bash Windows pode ser /tmp ou /c/...
# Com ALLOW_NON_TMP forçamos o caminho do extract no Windows.
if echo "$out" | grep -q "DEPLOY_STUB_OK expected=${COMMIT}"; then
  ok "entrypoint executa deploy do mesmo archive quando tip confere"
else
  nok "entrypoint nao chegou ao stub: $out"
fi

# Tip remoto diverge: remote bare aponta para outro commit; working tree fica no autorizado.
cd "$REPO"
echo x > extra.txt
git add extra.txt
git commit -qm 'outro tip'
OTHER_COMMIT="$(git rev-parse HEAD)"
git update-ref refs/heads/tmp-other "$OTHER_COMMIT"
git reset --hard "$COMMIT"

BARE="$TMP/origin.git"
git clone --bare -q "$REPO" "$BARE"
git -C "$BARE" update-ref refs/heads/feat/modulo-vendas "$OTHER_COMMIT"
git -C "$REPO" remote set-url origin "$BARE"
git -C "$REPO" branch -D tmp-other >/dev/null 2>&1 || true

out="$(
  PROJECT_DIR="$REPO" \
  BRANCH=feat/modulo-vendas \
  EXPECTED_COMMIT="$COMMIT" \
  ALLOW_NON_TMP_DEPLOY_EXTRACT=1 \
  bash "$EXTRACT/scripts/run-deploy-from-expected-commit.sh" 2>&1 || true
)"
if echo "$out" | grep -qi 'diverge'; then
  ok "entrypoint aborta quando origin/BRANCH diverge"
else
  nok "entrypoint nao abortou na divergencia: $out"
fi

echo
echo "passaram: $pass  falharam: $fail"
[ "$fail" -eq 0 ]
