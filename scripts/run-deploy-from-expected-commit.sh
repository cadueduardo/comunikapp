#!/usr/bin/env bash
# Gate 0S — entrypoint do deploy a partir do commit autorizado.
#
# O operador NAO executa o script que esta no working tree da VPS. Extrai este
# arquivo (e os helpers do deploy) do EXPECTED_COMMIT via `git archive` para um
# diretorio temporario e so entao chama o deploy. Assim o codigo que corre ja
# pertence ao artefato pinado.
#
# Extracao tipica (na VPS, como root ou com sudo):
#
#   PROJECT_DIR=/opt/comunikapp/app
#   EXPECTED_COMMIT=<sha-completo-do-commit-autorizado>
#   BRANCH=feat/modulo-vendas
#
#   sudo -u comunikapp git -C "$PROJECT_DIR" fetch origin --prune
#   # working tree limpo + origin/BRANCH == EXPECTED_COMMIT (este script confere)
#
#   TMP=$(mktemp -d)
#   trap 'rm -rf "$TMP"' EXIT
#   git -C "$PROJECT_DIR" archive "$EXPECTED_COMMIT" \
#     scripts/run-deploy-from-expected-commit.sh \
#     scripts/deploy-vps-branch-atual.sh \
#     scripts/lib/assert-expected-commit.sh \
#     | tar -x -C "$TMP"
#   # mktemp e 700: o deploy consulta helpers via run_as_app (usuario comunikapp).
#   chmod -R a+rX "$TMP"
#
#   sudo env \
#     PROJECT_DIR="$PROJECT_DIR" \
#     BRANCH="$BRANCH" \
#     EXPECTED_COMMIT="$EXPECTED_COMMIT" \
#     PRISMA_APPLY=migrate \
#     INSTALL_SYSTEM_PACKAGES=0 \
#     APPLY_NGINX=0 \
#     APPLY_FAIL2BAN=0 \
#     bash "$TMP/scripts/run-deploy-from-expected-commit.sh"
#
# Este script: valida pre-condicoes, confirma que esta rodando de um tree
# temporario coerente, e exec o deploy-vps-branch-atual.sh irmao.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/assert-expected-commit.sh
source "${SCRIPT_DIR}/lib/assert-expected-commit.sh"

log() {
  printf '[run-deploy-from-commit] %s\n' "$*"
}

fail() {
  printf '[run-deploy-from-commit] ERRO: %s\n' "$*" >&2
  exit 1
}

PROJECT_DIR="${PROJECT_DIR:-/opt/comunikapp/app}"
BRANCH="${BRANCH:-}"
EXPECTED_COMMIT="${EXPECTED_COMMIT:-}"
APP_USER="${APP_USER:-comunikapp}"

[ -n "$EXPECTED_COMMIT" ] || fail 'EXPECTED_COMMIT e obrigatorio neste entrypoint.'
[ -n "$BRANCH" ] || fail 'BRANCH e obrigatorio neste entrypoint.'
[ -d "$PROJECT_DIR/.git" ] || fail "PROJECT_DIR sem .git: ${PROJECT_DIR}"

case "$EXPECTED_COMMIT" in
  *[!0-9a-fA-F]*)
    fail 'EXPECTED_COMMIT deve ser hash SHA-1 (hex).'
    ;;
esac

[ "${#EXPECTED_COMMIT}" -ge 7 ] || fail 'EXPECTED_COMMIT muito curto; use o hash completo.'

# O entrypoint e o deploy devem ter vindo do mesmo archive (mesmo diretorio pai).
DEPLOY_SCRIPT="${SCRIPT_DIR}/deploy-vps-branch-atual.sh"
ASSERT_LIB="${SCRIPT_DIR}/lib/assert-expected-commit.sh"
[ -f "$DEPLOY_SCRIPT" ] || fail "deploy script ausente ao lado do entrypoint: ${DEPLOY_SCRIPT}"
[ -f "$ASSERT_LIB" ] || fail "helper ausente: ${ASSERT_LIB}"

# Evitar executar o working tree da VPS por engano: o caminho deve ser temporario
# (mktemp) ou explicitamente permitido. /tmp e /var/tmp cobrem o caso padrao.
case "$SCRIPT_DIR" in
  /tmp/*|/var/tmp/*)
    ;;
  *)
    if [ "${ALLOW_NON_TMP_DEPLOY_EXTRACT:-0}" != '1' ]; then
      fail "recusando executar de ${SCRIPT_DIR}; extraia com git archive para /tmp (ou ALLOW_NON_TMP_DEPLOY_EXTRACT=1 em ensaio)."
    fi
    ;;
esac

cd "$PROJECT_DIR"

if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
  fail 'working tree da VPS nao esta limpo. Resolva antes do deploy.'
fi

log "fetch origin (prune) em ${PROJECT_DIR}..."
git fetch origin --prune

# Resolve o commit autorizado de forma inequivoca (reusa a lib).
export EXPECTED_COMMIT
# Nao comparamos com HEAD ainda — o working tree pode estar em outro commit;
# o que importa e que origin/BRANCH e o objeto existam e batam.
resolved="$(
  matches=($(git rev-parse --disambiguate="$EXPECTED_COMMIT" 2>/dev/null || true))
  if [ "${#matches[@]}" -eq 0 ]; then
    echo ''
  elif [ "${#matches[@]}" -gt 1 ]; then
    echo 'AMBIGUOUS'
  else
    git rev-parse --verify "${matches[0]}^{commit}" 2>/dev/null || echo ''
  fi
)"

[ -n "$resolved" ] || fail "EXPECTED_COMMIT=${EXPECTED_COMMIT} nao resolve nenhum objeto."
[ "$resolved" != 'AMBIGUOUS' ] || fail "EXPECTED_COMMIT=${EXPECTED_COMMIT} e ambiguo."

obj_type="$(git cat-file -t "$resolved" 2>/dev/null || true)"
[ "$obj_type" = 'commit' ] || fail "EXPECTED_COMMIT nao e um commit (tipo=${obj_type:-ausente})."

remote_tip="$(git rev-parse --verify "origin/${BRANCH}" 2>/dev/null || true)"
[ -n "$remote_tip" ] || fail "origin/${BRANCH} nao existe apos o fetch."

if [ "$remote_tip" != "$resolved" ]; then
  fail "origin/${BRANCH} (${remote_tip}) diverge de EXPECTED_COMMIT (${resolved}). Abortando antes de build/backup/migration."
fi

# Exporta o hash completo para o deploy filho (pin apos pull).
export EXPECTED_COMMIT="$resolved"

log "pre-condicoes ok: origin/${BRANCH} == ${resolved}"
log "executando deploy extraido de ${SCRIPT_DIR}"

# O filho revalida HEAD apos o pull; aqui ja garantimos o tip remoto.
exec bash "$DEPLOY_SCRIPT"
