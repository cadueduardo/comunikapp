#!/usr/bin/env bash
# Deploy do Comunikapp no VPS: pull, build (frontend + backend), prisma migrate deploy e restart no PM2.
#
# IMPORTANTE - segurança:
#   - Este script NÃO deve ser executado como root.
#   - O usuário esperado é "comunikapp" (ou outro usuário não-root dedicado).
#   - O PM2 roda no contexto desse usuário (não use `sudo pm2`).
#
# Uso recomendado (na VPS):
#   sudo -iu comunikapp
#   cd /opt/comunikapp/app
#   ./scripts/deploy-vps.sh
#
# Variáveis (opcional): PROJECT_DIR, BRANCH, SKIP_BUILD_IF_NO_CHANGES
#   Ex.: BRANCH=main ./scripts/deploy-vps.sh
#   SKIP_BUILD_IF_NO_CHANGES=1 = quando já está em dia, só reinicia PM2 (não refaz build)

set -euo pipefail

# --- Guard de segurança: nunca rodar como root ---
if [ "$(id -u)" = "0" ]; then
  echo "[deploy-vps] ERRO: este script NÃO pode ser executado como root." >&2
  echo "[deploy-vps] Mude para o usuário de aplicação. Ex.: 'sudo -iu comunikapp' e rode de novo." >&2
  exit 1
fi

# --- Configuração (pode ser sobrescrita por env) ---
PROJECT_DIR="${PROJECT_DIR:-/opt/comunikapp/app}"
BRANCH="${BRANCH:-feature/rateio-por-setor}"
PM2_APPS=("comunikapp-backend" "comunikapp-frontend")

# --- Resolver diretório do projeto ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
if [ -n "${PROJECT_DIR}" ] && [ -d "${PROJECT_DIR}" ]; then
  ROOT_DIR="$(cd "${PROJECT_DIR}" && pwd)"
fi

cd "${ROOT_DIR}"
echo "[deploy-vps] Projeto:  Comunikapp"
echo "[deploy-vps] Pasta:    ${ROOT_DIR}"
echo "[deploy-vps] Usuário:  $(id -un) (uid=$(id -u))"
echo "[deploy-vps] Branch:   ${BRANCH}"

BACKEND_ENV="${ROOT_DIR}/backend/.env"
if [ ! -f "${BACKEND_ENV}" ]; then
  echo "[deploy-vps] ERRO: backend/.env não encontrado. Crie o arquivo com segredos reais antes do deploy." >&2
  exit 1
fi
if grep -Eq 'JWT_SECRET="?((your-secret-key)|(your-super-secret-jwt-key-change-this-in-production)|(sua-chave-secreta-aqui))"?' "${BACKEND_ENV}"; then
  echo "[deploy-vps] ERRO: JWT_SECRET está usando placeholder inseguro em backend/.env." >&2
  echo "[deploy-vps] Gere um segredo forte. Ex.: openssl rand -base64 48" >&2
  exit 1
fi
if [ "$(stat -c '%a' "${BACKEND_ENV}" 2>/dev/null || echo 600)" != "600" ]; then
  echo "[deploy-vps] AVISO: backend/.env deveria estar com permissão 600." >&2
fi

COMMIT_ANTES="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
echo "[deploy-vps] Commit atual: ${COMMIT_ANTES}"
echo ""

# --- Pre-flight: PM2 disponível para o usuário atual ---
if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy-vps] ERRO: 'pm2' não encontrado no PATH do usuário '$(id -un)'." >&2
  echo "[deploy-vps] Instale com: npm i -g pm2  (como o próprio usuário de aplicação)." >&2
  exit 1
fi

echo "[deploy-vps] 1/5 Git fetch e pull..."
git fetch origin
COMMIT_DEPOIS=""
if git pull --ff-only origin "${BRANCH}"; then
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
if [ "${SKIP_BUILD_IF_NO_CHANGES:-0}" = "1" ] && [ "${COMMIT_ANTES}" = "${COMMIT_DEPOIS}" ]; then
  BUILD_BACKEND=0
  BUILD_FRONTEND=0
  echo "[deploy-vps] SKIP_BUILD_IF_NO_CHANGES=1: pulando builds, só restart."
elif [ -n "${CHANGED_FILES}" ]; then
  if echo "${CHANGED_FILES}" | grep -qE '^backend/'; then
    : # backend mudou
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
echo "${CHANGED_FILES}" | grep -qE '^backend/(package\.json|package-lock\.json)' && BACKEND_DEPS_CHANGED=1 || true
echo "${CHANGED_FILES}" | grep -qE '^frontend/(package\.json|package-lock\.json)' && FRONTEND_DEPS_CHANGED=1 || true

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
BEXIT=0
FEXIT=0
if [ "$BUILD_BACKEND" -eq 1 ] && [ "$BUILD_FRONTEND" -eq 1 ]; then
  ( run_backend ) & BPID=$!
  ( run_frontend ) & FPID=$!
  wait $BPID || BEXIT=$?
  wait $FPID || FEXIT=$?
elif [ "$BUILD_BACKEND" -eq 1 ]; then
  ( run_backend ) || BEXIT=$?
elif [ "$BUILD_FRONTEND" -eq 1 ]; then
  ( run_frontend ) || FEXIT=$?
fi
if [ "$BEXIT" -ne 0 ]; then echo "[deploy-vps] Backend build falhou (exit $BEXIT)."; exit 1; fi
if [ "$FEXIT" -ne 0 ]; then echo "[deploy-vps] Frontend build falhou (exit $FEXIT)."; exit 1; fi
echo ""

echo "[deploy-vps] 3/5 Prisma migrate deploy..."
(
  cd "${ROOT_DIR}/backend"
  npx prisma migrate deploy
) || { echo "[deploy-vps] ERRO: prisma migrate deploy falhou. Verifique o banco."; exit 1; }
echo ""

echo "[deploy-vps] 4/5 Reiniciando aplicações no PM2 (usuário $(id -un))..."
# Se o ecosystem.config.js existir e os apps ainda não estiverem registrados, usa startOrReload.
# Caso contrário, faz restart direto (mais rápido).
if [ -f "${ROOT_DIR}/ecosystem.config.js" ]; then
  pm2 startOrReload "${ROOT_DIR}/ecosystem.config.js" --update-env
else
  pm2 restart "${PM2_APPS[@]}" --update-env
fi
pm2 save
echo ""

echo "[deploy-vps] 5/5 Status final do PM2:"
pm2 list
echo ""

COMMIT_FINAL="$(git rev-parse --short HEAD)"
echo "[deploy-vps] Deploy concluído. Commit em produção: ${COMMIT_FINAL}"
echo "[deploy-vps] Se o site não refletir, force atualização: Ctrl+Shift+R (Cmd+Shift+R no Mac)."
