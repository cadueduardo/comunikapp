#!/usr/bin/env bash
# Deploy do Comunikapp no VPS: pull, build (frontend + backend), prisma migrate deploy e restart no PM2.
# Uso: no VPS, dentro da pasta do projeto: ./scripts/deploy-vps.sh
# Ou: bash /opt/comunikapp/scripts/deploy-vps.sh
#
# Variáveis (opcional): PROJECT_DIR, BRANCH, RESTART_CMD, SKIP_BUILD_IF_NO_CHANGES
# Ex.: BRANCH=feature/modulo-pcp-clean ./scripts/deploy-vps.sh
# SKIP_BUILD_IF_NO_CHANGES=1 = quando já está em dia, só reinicia PM2 (não refaz build)

set -e

# --- Configure aqui (ou exporte antes de rodar) ---
# Pasta do projeto no VPS
PROJECT_DIR="${PROJECT_DIR:-/opt/comunikapp}"
# Branch para dar pull (padrão: feature/modulo-pcp-clean; use BRANCH=main para outra)
BRANCH="${BRANCH:-feature/modulo-pcp-clean}"
# Reiniciar backend e frontend no PM2 (rodando como root no VPS)
RESTART_CMD="${RESTART_CMD:-sudo pm2 restart comunikapp-backend comunikapp-frontend}"
# --- Fim da configuração ---

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [ -n "${PROJECT_DIR}" ] && [ -d "${PROJECT_DIR}" ]; then
  ROOT_DIR="$(cd "${PROJECT_DIR}" && pwd)"
fi

cd "${ROOT_DIR}"
echo "[deploy-vps] Projeto: Comunikapp"
echo "[deploy-vps] Pasta: ${ROOT_DIR}"
echo "[deploy-vps] Branch: ${BRANCH}"
COMMIT_ANTES="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
echo "[deploy-vps] Commit atual: ${COMMIT_ANTES}"
echo ""

echo "[deploy-vps] 1/5 Git fetch e pull..."
git fetch origin
COMMIT_DEPOIS=""
if git pull origin "${BRANCH}"; then
  COMMIT_DEPOIS="$(git rev-parse --short HEAD)"
  if [ "${COMMIT_ANTES}" = "${COMMIT_DEPOIS}" ]; then
    echo "[deploy-vps] Nenhuma alteração nova (já em ${COMMIT_DEPOIS})."
  else
    echo "[deploy-vps] Atualizado: ${COMMIT_ANTES} -> ${COMMIT_DEPOIS}"
  fi
fi
[ -z "${COMMIT_DEPOIS}" ] && COMMIT_DEPOIS="$(git rev-parse --short HEAD)"

# Só construir o que mudou (deploy mais rápido quando só frontend ou só backend)
CHANGED_FILES="$(git diff --name-only "${COMMIT_ANTES}" "${COMMIT_DEPOIS}" 2>/dev/null || true)"
BUILD_BACKEND=1
BUILD_FRONTEND=1
if [ "${SKIP_BUILD_IF_NO_CHANGES}" = "1" ] && [ "${COMMIT_ANTES}" = "${COMMIT_DEPOIS}" ]; then
  BUILD_BACKEND=0
  BUILD_FRONTEND=0
  echo "[deploy-vps] SKIP_BUILD_IF_NO_CHANGES=1: pulando builds, só restart."
elif [ -n "${CHANGED_FILES}" ]; then
  if echo "${CHANGED_FILES}" | grep -qE '^backend/'; then
    : # backend mudou, manter BUILD_BACKEND=1
  else
    BUILD_BACKEND=0
    echo "[deploy-vps] Apenas frontend alterado: build só do frontend."
  fi
  if echo "${CHANGED_FILES}" | grep -qE '^frontend/'; then
    : # frontend mudou
  else
    BUILD_FRONTEND=0
    echo "[deploy-vps] Apenas backend alterado: build só do backend."
  fi
fi

BACKEND_DEPS_CHANGED=0
FRONTEND_DEPS_CHANGED=0
echo "${CHANGED_FILES}" | grep -qE '^backend/(package\.json|package-lock\.json)' && BACKEND_DEPS_CHANGED=1
echo "${CHANGED_FILES}" | grep -qE '^frontend/(package\.json|package-lock\.json)' && FRONTEND_DEPS_CHANGED=1

echo "[deploy-vps] 2/5 Build..."
run_backend() {
  [ "$BUILD_BACKEND" -eq 0 ] && return 0
  cd "${ROOT_DIR}/backend"
  if [ "$BACKEND_DEPS_CHANGED" -eq 1 ]; then npm ci && npm run build; else npm run build; fi
}
run_frontend() {
  [ "$BUILD_FRONTEND" -eq 0 ] && return 0
  cd "${ROOT_DIR}/frontend"
  if [ "$FRONTEND_DEPS_CHANGED" -eq 1 ]; then npm ci && npm run build; else npm run build; fi
}
export ROOT_DIR BUILD_BACKEND BUILD_FRONTEND BACKEND_DEPS_CHANGED FRONTEND_DEPS_CHANGED
if [ "$BUILD_BACKEND" -eq 1 ] && [ "$BUILD_FRONTEND" -eq 1 ]; then
  ( run_backend ) & BPID=$!
  ( run_frontend ) & FPID=$!
  wait $BPID; BEXIT=$?
  wait $FPID; FEXIT=$?
elif [ "$BUILD_BACKEND" -eq 1 ]; then
  ( run_backend ); BEXIT=$?; FEXIT=0
elif [ "$BUILD_FRONTEND" -eq 1 ]; then
  ( run_frontend ); FEXIT=$?; BEXIT=0
else
  BEXIT=0; FEXIT=0
fi
if [ "$BEXIT" -ne 0 ]; then echo "[deploy-vps] Backend build falhou (exit $BEXIT)."; exit 1; fi
if [ "$FEXIT" -ne 0 ]; then echo "[deploy-vps] Frontend build falhou (exit $FEXIT)."; exit 1; fi
echo ""

echo "[deploy-vps] 3/5 Prisma migrate deploy..."
(cd "${ROOT_DIR}/backend" && npx prisma migrate deploy) || { echo "[deploy-vps] AVISO: prisma migrate deploy falhou. Verifique o banco."; exit 1; }
echo ""

echo "[deploy-vps] 4/5 Salvando lista do PM2..."
sudo pm2 save 2>/dev/null || true
echo ""

echo "[deploy-vps] 5/5 Reiniciando app: ${RESTART_CMD}"
eval "${RESTART_CMD}"
echo ""

COMMIT_FINAL="$(git rev-parse --short HEAD)"
echo "[deploy-vps] Deploy concluído. Commit em produção: ${COMMIT_FINAL}"
echo "[deploy-vps] Se o site não refletir as mudanças, force atualização no navegador: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)."
