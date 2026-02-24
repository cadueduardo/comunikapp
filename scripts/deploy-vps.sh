#!/usr/bin/env bash
# Deploy do Comunikapp no VPS: pull, build (frontend + backend) e restart no PM2.
# Uso: no VPS, dentro da pasta do projeto: ./scripts/deploy-vps.sh
# Ou: bash /opt/comunikapp/scripts/deploy-vps.sh
#
# Variáveis (opcional): PROJECT_DIR, BRANCH, RESTART_CMD
# Ex.: BRANCH=feature/modulo-pcp-clean ./scripts/deploy-vps.sh

set -e

# --- Configure aqui (ou exporte antes de rodar) ---
# Pasta do projeto no VPS
PROJECT_DIR="${PROJECT_DIR:-/opt/comunikapp}"
# Branch para dar pull
BRANCH="${BRANCH:-main}"
# Reiniciar backend (id 1) e frontend (id 2) no PM2 (rodando como root no VPS)
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
echo ""

echo "[deploy-vps] 1/5 Git fetch e pull..."
git fetch origin
git pull origin "${BRANCH}"
echo ""

echo "[deploy-vps] 2/5 Backend: npm ci e build..."
cd "${ROOT_DIR}/backend"
npm ci
npm run build
cd "${ROOT_DIR}"
echo ""

echo "[deploy-vps] 3/5 Frontend: npm ci e build..."
cd "${ROOT_DIR}/frontend"
npm ci
npm run build
cd "${ROOT_DIR}"
echo ""

echo "[deploy-vps] 4/5 Salvando lista do PM2..."
sudo pm2 save 2>/dev/null || true
echo ""

echo "[deploy-vps] 5/5 Reiniciando app: ${RESTART_CMD}"
eval "${RESTART_CMD}"
echo ""

echo "[deploy-vps] Deploy concluído."
