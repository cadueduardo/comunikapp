#!/usr/bin/env bash
# Deploy do Comunikapp no VPS: pull, build (frontend + backend) e restart no PM2.
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

echo "[deploy-vps] 1/4 Git fetch e pull..."
git fetch origin
if git pull origin "${BRANCH}"; then
  COMMIT_DEPOIS="$(git rev-parse --short HEAD)"
  if [ "${COMMIT_ANTES}" = "${COMMIT_DEPOIS}" ]; then
    echo "[deploy-vps] Nenhuma alteração nova (já em ${COMMIT_DEPOIS}). Build será refeito mesmo assim."
  else
    echo "[deploy-vps] Atualizado: ${COMMIT_ANTES} -> ${COMMIT_DEPOIS}"
  fi
fi
echo ""

echo "[deploy-vps] 2/4 Backend e frontend: npm ci + build (em paralelo)..."
(
  cd "${ROOT_DIR}/backend" && npm ci && npm run build
) &
BACKEND_PID=$!
(
  cd "${ROOT_DIR}/frontend" && npm ci && npm run build
) &
FRONTEND_PID=$!
wait $BACKEND_PID; BACKEND_EXIT=$?
wait $FRONTEND_PID; FRONTEND_EXIT=$?
if [ "$BACKEND_EXIT" -ne 0 ]; then echo "[deploy-vps] Backend build falhou (exit $BACKEND_EXIT)."; exit 1; fi
if [ "$FRONTEND_EXIT" -ne 0 ]; then echo "[deploy-vps] Frontend build falhou (exit $FRONTEND_EXIT)."; exit 1; fi
echo ""

echo "[deploy-vps] 3/4 Salvando lista do PM2..."
sudo pm2 save 2>/dev/null || true
echo ""

echo "[deploy-vps] 4/4 Reiniciando app: ${RESTART_CMD}"
eval "${RESTART_CMD}"
echo ""

COMMIT_FINAL="$(git rev-parse --short HEAD)"
echo "[deploy-vps] Deploy concluído. Commit em produção: ${COMMIT_FINAL}"
echo "[deploy-vps] Se o site não refletir as mudanças, force atualização no navegador: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)."
