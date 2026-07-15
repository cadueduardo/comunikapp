#!/usr/bin/env bash
# Deploy de producao do Comunikapp na VPS.
#
# Ambiente esperado:
#   - Usuario administrativo executa este script via sudo.
#   - Usuario de aplicacao: comunikapp
#   - Projeto: /srv/apps/comunikapp/releases/current
#   - Env backend: /srv/apps/comunikapp/shared/env/backend.env
#   - Servicos: comunikapp-backend e comunikapp-frontend via systemd
#
# Uso na VPS:
#   sudo bash /srv/apps/comunikapp/releases/current/scripts/deploy-vps.sh
#
# Variaveis opcionais:
#   BRANCH=feature/rateio-por-setor
#   PROJECT_DIR=/srv/apps/comunikapp/releases/current
#   PRISMA_APPLY=migrate|push|skip (padrao: migrate)
#   DB_BACKUP_DIR=/srv/apps/comunikapp/shared/backups/database
#   DB_BACKUP_RETENTION_DAYS=14

set -euo pipefail

APP_USER="${APP_USER:-comunikapp}"
PROJECT_DIR="${PROJECT_DIR:-/srv/apps/comunikapp/releases/current}"
BRANCH="${BRANCH:-feature/rateio-por-setor}"
BACKEND_SERVICE="${BACKEND_SERVICE:-comunikapp-backend}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-comunikapp-frontend}"
BACKEND_ENV="${BACKEND_ENV:-/srv/apps/comunikapp/shared/env/backend.env}"
PRISMA_APPLY="${PRISMA_APPLY:-migrate}"

log() {
  printf '[deploy-vps] %s\n' "$*"
}

fail() {
  printf '[deploy-vps] ERRO: %s\n' "$*" >&2
  exit 1
}

quote() {
  printf "%q" "$1"
}

run_as_app() {
  local command="$1"

  if [ "$(id -un)" = "${APP_USER}" ]; then
    bash -lc "cd $(quote "${PROJECT_DIR}") && ${command}"
  else
    sudo -u "${APP_USER}" bash -lc "cd $(quote "${PROJECT_DIR}") && ${command}"
  fi
}

[ -d "${PROJECT_DIR}" ] || fail "pasta do projeto nao encontrada: ${PROJECT_DIR}"
[ -f "${BACKEND_ENV}" ] || fail "env do backend nao encontrado: ${BACKEND_ENV}"

run_as_app '[ -d .git ]' || fail "${PROJECT_DIR} nao parece ser um repositorio Git."

if ! run_as_app 'git diff --quiet && git diff --cached --quiet'; then
  fail "existem alteracoes locais no repositorio da VPS. Resolva antes do deploy."
fi

if sudo grep -Eq 'JWT_SECRET="?((your-secret-key)|(your-super-secret-jwt-key-change-this-in-production)|(sua-chave-secreta-aqui))"?' "${BACKEND_ENV}"; then
  fail "JWT_SECRET esta usando placeholder inseguro em ${BACKEND_ENV}."
fi

if sudo grep -Eq 'TWO_FACTOR_ENCRYPTION_KEY="?((change-me)|(sua-chave-secreta-aqui))"?' "${BACKEND_ENV}"; then
  fail "TWO_FACTOR_ENCRYPTION_KEY esta usando placeholder inseguro em ${BACKEND_ENV}."
fi

ENV_PERMS="$(sudo stat -c '%a' "${BACKEND_ENV}")"
if [ "${ENV_PERMS}" != "600" ]; then
  fail "${BACKEND_ENV} deve estar com permissao 600; atual=${ENV_PERMS}."
fi

COMMIT_BEFORE="$(run_as_app 'git rev-parse --short HEAD')"
log "Projeto: ${PROJECT_DIR}"
log "Usuario app: ${APP_USER}"
log "Usuario deploy: $(id -un)"
log "Branch: ${BRANCH}"
log "Commit atual: ${COMMIT_BEFORE}"

log "1/7 Atualizando codigo..."
run_as_app 'git fetch origin'
run_as_app "git pull --ff-only origin $(quote "${BRANCH}")"
COMMIT_AFTER="$(run_as_app 'git rev-parse --short HEAD')"
log "Commit alvo: ${COMMIT_AFTER}"

log "2/7 Instalando dependencias do backend com npm ci..."
run_as_app 'cd backend && npm ci'

log "3/7 Instalando dependencias do frontend com npm ci..."
run_as_app 'cd frontend && npm ci'

log "4/7 Aplicando schema Prisma..."
case "${PRISMA_APPLY}" in
  push)
    fail "PRISMA_APPLY=push bloqueado em producao; use migrate ou skip."
    ;;
  migrate)
    run_as_app "cd backend && set -a && . $(quote "${BACKEND_ENV}") && set +a && node scripts/mysql-backup-before-deploy.js"
    run_as_app "cd backend && set -a && . $(quote "${BACKEND_ENV}") && set +a && node scripts/prisma-deploy-preflight.js --apply"
    run_as_app "cd backend && set -a && . $(quote "${BACKEND_ENV}") && set +a && npx prisma migrate deploy"
    ;;
  skip)
    log "Prisma ignorado por PRISMA_APPLY=skip."
    ;;
  *)
    fail "PRISMA_APPLY invalido: ${PRISMA_APPLY}. Use push, migrate ou skip."
    ;;
esac

log "5/7 Build backend e frontend..."
run_as_app 'cd backend && npm run build'
run_as_app 'cd frontend && npm run build'

log "6/7 Removendo dependencias de desenvolvimento..."
run_as_app 'cd backend && npm prune --omit=dev'
run_as_app 'cd frontend && npm prune --omit=dev'

log "7/7 Reiniciando servicos systemd..."
sudo systemctl restart "${BACKEND_SERVICE}"
sudo systemctl restart "${FRONTEND_SERVICE}"
sudo systemctl --no-pager --full status "${BACKEND_SERVICE}" | sed -n '1,12p'
sudo systemctl --no-pager --full status "${FRONTEND_SERVICE}" | sed -n '1,12p'

log "Deploy concluido. Commit em producao: ${COMMIT_AFTER}"
