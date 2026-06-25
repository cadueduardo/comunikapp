#!/usr/bin/env bash
# Deploy completo do branch atual do Comunikapp na VPS.
#
# Uso recomendado na VPS:
#   sudo bash /opt/comunikapp/app/scripts/deploy-vps-branch-atual.sh
#
# Variaveis opcionais:
#   PROJECT_DIR=/opt/comunikapp/app
#   APP_USER=comunikapp
#   BRANCH=nome-do-branch
#   PRISMA_APPLY=migrate|push|skip
#   RUNTIME=auto|pm2|systemd
#   APPLY_NGINX=1|0
#   APPLY_FAIL2BAN=1|0
#   INSTALL_SYSTEM_PACKAGES=1|0
#   RUN_AUDIT=1|0
#   SKIP_HEALTH_CHECKS=1|0

set -euo pipefail

APP_USER="${APP_USER:-comunikapp}"
PROJECT_DIR="${PROJECT_DIR:-}"
BRANCH="${BRANCH:-}"
PRISMA_APPLY="${PRISMA_APPLY:-migrate}"
RUNTIME="${RUNTIME:-auto}"
APPLY_NGINX="${APPLY_NGINX:-1}"
APPLY_FAIL2BAN="${APPLY_FAIL2BAN:-1}"
INSTALL_SYSTEM_PACKAGES="${INSTALL_SYSTEM_PACKAGES:-1}"
RUN_AUDIT="${RUN_AUDIT:-1}"
SKIP_HEALTH_CHECKS="${SKIP_HEALTH_CHECKS:-0}"
BACKEND_SERVICE="${BACKEND_SERVICE:-comunikapp-backend}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-comunikapp-frontend}"

log() {
  printf '[deploy-branch-atual] %s\n' "$*"
}

fail() {
  printf '[deploy-branch-atual] ERRO: %s\n' "$*" >&2
  exit 1
}

quote() {
  printf '%q' "$1"
}

detect_project_dir() {
  if [ -n "${PROJECT_DIR}" ]; then
    return
  fi

  if [ -d /opt/comunikapp/app/.git ]; then
    PROJECT_DIR=/opt/comunikapp/app
    return
  fi

  if [ -d /srv/apps/comunikapp/releases/current/.git ]; then
    PROJECT_DIR=/srv/apps/comunikapp/releases/current
    return
  fi

  fail 'PROJECT_DIR nao informado e nenhum projeto conhecido foi encontrado.'
}

run_as_app() {
  local command="$1"

  if [ "$(id -un)" = "${APP_USER}" ]; then
    bash -lc "cd $(quote "${PROJECT_DIR}") && ${command}"
  else
    sudo -u "${APP_USER}" -H bash -lc "cd $(quote "${PROJECT_DIR}") && ${command}"
  fi
}

require_root_for_system_changes() {
  if [ "$(id -u)" -ne 0 ]; then
    fail 'execute com sudo para instalar pacotes, aplicar Nginx/Fail2ban e reiniciar servicos.'
  fi
}

env_value() {
  local file="$1"
  local key="$2"

  awk -F= -v key="$key" '
    $0 ~ "^[[:space:]]*#" { next }
    $1 == key {
      value = substr($0, index($0, "=") + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      gsub(/^"|"$/, "", value)
      gsub(/^'\''|'\''$/, "", value)
      print value
      exit
    }
  ' "$file"
}

require_env_value() {
  local file="$1"
  local key="$2"
  local value
  value="$(env_value "$file" "$key")"

  [ -n "$value" ] || fail "${key} ausente em ${file}."
  case "$value" in
    TROCAR*|your-secret-key|your-super-secret-jwt-key-change-this-in-production|sua-chave-secreta-aqui|change-me)
      fail "${key} esta com placeholder inseguro em ${file}."
      ;;
  esac
}

require_env_min_length() {
  local file="$1"
  local key="$2"
  local min_length="$3"
  local value
  value="$(env_value "$file" "$key")"

  [ -n "$value" ] || fail "${key} ausente em ${file}."
  [ "${#value}" -ge "$min_length" ] || fail "${key} deve ter pelo menos ${min_length} caracteres em ${file}."
}

require_env_not_true() {
  local file="$1"
  local key="$2"
  local value
  value="$(env_value "$file" "$key" | tr '[:upper:]' '[:lower:]')"

  [ "$value" != 'true' ] || fail "${key}=true nao e permitido em producao (${file})."
}

install_system_packages() {
  [ "$INSTALL_SYSTEM_PACKAGES" = '1' ] || {
    log 'Instalacao de pacotes do sistema ignorada.'
    return
  }

  require_root_for_system_changes

  if ! command -v apt-get >/dev/null 2>&1; then
    fail 'este script espera uma VPS Debian/Ubuntu com apt-get.'
  fi

  log 'Instalando/atualizando pacotes de sistema necessarios...'
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y \
    ca-certificates \
    curl \
    git \
    iproute2 \
    build-essential \
    python3 \
    make \
    g++ \
    pkg-config \
    libvips42 \
    nginx \
    certbot \
    python3-certbot-nginx \
    fail2ban
}

validate_node() {
  command -v node >/dev/null 2>&1 || fail 'Node.js nao encontrado na VPS.'
  command -v npm >/dev/null 2>&1 || fail 'npm nao encontrado na VPS.'

  local major
  major="$(node -p "Number(process.versions.node.split('.')[0])")"
  [ "$major" -ge 20 ] || fail "Node.js 20+ e requerido. Versao atual: $(node -v)."
}

detect_env_files() {
  BACKEND_ENV="${BACKEND_ENV:-${PROJECT_DIR}/backend/.env}"
  FRONTEND_ENV="${FRONTEND_ENV:-${PROJECT_DIR}/frontend/.env.production}"

  if [ ! -f "$BACKEND_ENV" ] && [ -f /srv/apps/comunikapp/shared/env/backend.env ]; then
    BACKEND_ENV=/srv/apps/comunikapp/shared/env/backend.env
  fi

  [ -f "$BACKEND_ENV" ] || fail "env do backend nao encontrado: ${BACKEND_ENV}"
  [ -f "$FRONTEND_ENV" ] || fail "env do frontend nao encontrado: ${FRONTEND_ENV}"
}

validate_env_files() {
  log 'Validando envs de producao e segredos obrigatorios...'

  require_env_value "$BACKEND_ENV" DATABASE_URL
  require_env_min_length "$BACKEND_ENV" JWT_SECRET 32
  require_env_min_length "$BACKEND_ENV" ESTOQUE_INTERNAL_API_TOKEN 32
  require_env_value "$BACKEND_ENV" FRONTEND_URL
  require_env_value "$FRONTEND_ENV" NEXT_PUBLIC_API_URL
  require_env_value "$FRONTEND_ENV" BACKEND_URL

  local node_env host cors_via_proxy
  node_env="$(env_value "$BACKEND_ENV" NODE_ENV)"
  host="$(env_value "$BACKEND_ENV" HOST)"
  cors_via_proxy="$(env_value "$BACKEND_ENV" CORS_VIA_PROXY)"

  [ "$node_env" = 'production' ] || fail "NODE_ENV deve ser production em ${BACKEND_ENV}."
  [ "$host" = '127.0.0.1' ] || fail "HOST deve ser 127.0.0.1 em ${BACKEND_ENV}."
  [ "$cors_via_proxy" = 'true' ] || fail "CORS_VIA_PROXY deve ser true em ${BACKEND_ENV}."

  require_env_not_true "$BACKEND_ENV" ENABLE_SWAGGER
  require_env_not_true "$BACKEND_ENV" SERVE_PUBLIC_ARTE_UPLOADS

  if [ "$(id -u)" -eq 0 ]; then
    chown "${APP_USER}:${APP_USER}" "$BACKEND_ENV" "$FRONTEND_ENV"
    chmod 600 "$BACKEND_ENV" "$FRONTEND_ENV"
  fi
}

prepare_upload_dirs() {
  require_root_for_system_changes

  mkdir -p /srv/apps/comunikapp/shared/uploads
  mkdir -p "${PROJECT_DIR}/backend/uploads"
  chown -R "${APP_USER}:${APP_USER}" /srv/apps/comunikapp/shared/uploads
  chown -R "${APP_USER}:${APP_USER}" "${PROJECT_DIR}/backend/uploads"
  chmod 750 /srv/apps/comunikapp/shared/uploads
  chmod 750 "${PROJECT_DIR}/backend/uploads"
}

update_code() {
  run_as_app '[ -d .git ]' || fail "${PROJECT_DIR} nao parece ser um repositorio Git."

  if ! run_as_app 'git diff --quiet && git diff --cached --quiet'; then
    fail 'existem alteracoes locais no repositorio da VPS. Resolva antes do deploy.'
  fi

  if [ -z "$BRANCH" ]; then
    BRANCH="$(run_as_app 'git rev-parse --abbrev-ref HEAD')"
  fi

  log "Atualizando codigo do branch ${BRANCH}..."
  run_as_app 'git fetch origin --prune'
  run_as_app "git show-ref --verify --quiet refs/heads/$(quote "$BRANCH") && git checkout $(quote "$BRANCH") || git checkout -b $(quote "$BRANCH") origin/$(quote "$BRANCH")"
  run_as_app "git pull --ff-only origin $(quote "$BRANCH")"
  log "Commit em deploy: $(run_as_app 'git rev-parse --short HEAD')"
}

install_dependencies() {
  log 'Instalando dependencias com npm ci...'
  run_as_app 'cd backend && npm ci'
  run_as_app 'cd frontend && npm ci'
  run_as_app 'cd backend && npm rebuild sharp || true'
}

apply_prisma() {
  log "Aplicando Prisma (${PRISMA_APPLY})..."

  run_as_app "cd backend && set -a && . $(quote "$BACKEND_ENV") && set +a && echo 'SELECT 1;' | ./node_modules/.bin/prisma db execute --schema=prisma/schema.prisma --stdin"
  run_as_app 'cd backend && ./node_modules/.bin/prisma generate'

  case "$PRISMA_APPLY" in
    migrate)
      run_as_app "cd backend && set -a && . $(quote "$BACKEND_ENV") && set +a && ./node_modules/.bin/prisma migrate deploy"
      ;;
    push)
      run_as_app "cd backend && set -a && . $(quote "$BACKEND_ENV") && set +a && ./node_modules/.bin/prisma db push"
      ;;
    skip)
      log 'Prisma migrate/db push ignorado por PRISMA_APPLY=skip.'
      ;;
    *)
      fail 'PRISMA_APPLY invalido. Use migrate, push ou skip.'
      ;;
  esac
}

build_apps() {
  log 'Executando builds de producao...'
  run_as_app 'cd backend && npm run build'
  run_as_app 'cd frontend && npm run build'
}

audit_dependencies() {
  [ "$RUN_AUDIT" = '1' ] || {
    log 'npm audit ignorado.'
    return
  }

  log 'Rodando npm audit --omit=dev...'
  run_as_app 'cd backend && npm audit --omit=dev'
  run_as_app 'cd frontend && npm audit --omit=dev'
}

prune_dependencies() {
  log 'Removendo dependencias de desenvolvimento...'
  run_as_app 'cd backend && npm prune --omit=dev'
  run_as_app 'cd frontend && npm prune --omit=dev'
}

apply_nginx() {
  [ "$APPLY_NGINX" = '1' ] || {
    log 'Aplicacao do Nginx ignorada.'
    return
  }

  require_root_for_system_changes

  log 'Aplicando configuracoes canonicas do Nginx...'
  mkdir -p /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled /var/www/certbot
  cp "${PROJECT_DIR}/deploy/nginx/cors-map.conf" /etc/nginx/conf.d/cors-map.conf
  cp "${PROJECT_DIR}/deploy/nginx/api.comunikapp.com.br.conf" /etc/nginx/sites-available/api.comunikapp.com.br.conf
  cp "${PROJECT_DIR}/deploy/nginx/comunikapp.com.br.conf" /etc/nginx/sites-available/comunikapp.com.br.conf
  ln -sf /etc/nginx/sites-available/api.comunikapp.com.br.conf /etc/nginx/sites-enabled/api.comunikapp.com.br.conf
  ln -sf /etc/nginx/sites-available/comunikapp.com.br.conf /etc/nginx/sites-enabled/comunikapp.com.br.conf
  rm -f /etc/nginx/sites-enabled/default
  chown -R www-data:www-data /var/www/certbot
  nginx -t
  systemctl reload nginx
}

apply_fail2ban() {
  [ "$APPLY_FAIL2BAN" = '1' ] || {
    log 'Aplicacao do Fail2ban ignorada.'
    return
  }

  require_root_for_system_changes

  if [ -f "${PROJECT_DIR}/deploy/fail2ban/jail.local" ]; then
    log 'Aplicando Fail2ban canonico...'
    cp "${PROJECT_DIR}/deploy/fail2ban/jail.local" /etc/fail2ban/jail.local
    systemctl enable fail2ban
    systemctl restart fail2ban
  fi
}

detect_runtime() {
  if [ "$RUNTIME" != 'auto' ]; then
    return
  fi

  if command -v pm2 >/dev/null 2>&1 && [ "$PROJECT_DIR" = '/opt/comunikapp/app' ] && [ -f "${PROJECT_DIR}/ecosystem.config.js" ]; then
    RUNTIME=pm2
  else
    RUNTIME=systemd
  fi
}

restart_apps() {
  detect_runtime
  log "Reiniciando aplicacao via ${RUNTIME}..."

  case "$RUNTIME" in
    pm2)
      run_as_app 'pm2 startOrReload ecosystem.config.js --update-env'
      run_as_app 'pm2 save'
      run_as_app 'pm2 list'
      ;;
    systemd)
      require_root_for_system_changes
      systemctl restart "$BACKEND_SERVICE"
      systemctl restart "$FRONTEND_SERVICE"
      systemctl --no-pager --full status "$BACKEND_SERVICE" | sed -n '1,12p'
      systemctl --no-pager --full status "$FRONTEND_SERVICE" | sed -n '1,12p'
      ;;
    *)
      fail 'RUNTIME invalido. Use auto, pm2 ou systemd.'
      ;;
  esac
}

health_checks() {
  if [ "$SKIP_HEALTH_CHECKS" = '1' ]; then
    log 'Health checks ignorados (SKIP_HEALTH_CHECKS=1).'
    return
  fi

  local backend_port frontend_port docs_status uploads_status front_status
  local backend_health front_body_file pm2_frontend_status

  backend_port="$(env_value "$BACKEND_ENV" PORT)"
  backend_port="${backend_port:-4001}"
  # O PM2 inicia o Next com "-p 3001" fixo em ecosystem.config.js (nao usar PORT do .env).
  frontend_port=3001

  log 'Validando portas locais...'
  ss -tlnp | grep -E "127\\.0\\.0\\.1:(${backend_port}|${frontend_port})" || true

  pm2_frontend_status="$(run_as_app "pm2 describe comunikapp-frontend 2>/dev/null | awk '/status/{print \$4; exit}'" || true)"
  log "PM2 comunikapp-frontend: ${pm2_frontend_status:-desconhecido}"
  [ "$pm2_frontend_status" = 'online' ] || fail 'comunikapp-frontend nao esta online no PM2.'

  backend_health="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${backend_port}/lojas/health" || true)"
  case "$backend_health" in
    200) log "Backend local /lojas/health: HTTP ${backend_health}." ;;
    *) fail "Backend local nao respondeu /lojas/health. HTTP ${backend_health}." ;;
  esac

  docs_status="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${backend_port}/api/docs" || true)"
  [ "$docs_status" != '200' ] || fail 'Swagger esta acessivel em producao (/api/docs retornou 200).'

  uploads_status="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${backend_port}/uploads/arte/health-check" || true)"
  [ "$uploads_status" != '200' ] || fail '/uploads/arte esta acessivel diretamente no backend.'

  front_body_file="$(mktemp)"
  front_status="$(curl -s -o "$front_body_file" -w '%{http_code}' "http://127.0.0.1:${frontend_port}/" || true)"
  if grep -q '"statusCode":401' "$front_body_file" 2>/dev/null; then
    rm -f "$front_body_file"
    fail "Porta ${frontend_port} respondeu JSON 401 do NestJS. O frontend Next.js nao esta servindo essa porta."
  fi
  rm -f "$front_body_file"

  case "$front_status" in
    2*|3*) log "Frontend local respondeu HTTP ${front_status}." ;;
    *) fail "Frontend local nao respondeu corretamente. HTTP ${front_status}." ;;
  esac

  log "Swagger local /api/docs: HTTP ${docs_status} (esperado: nao 200)."
  log "Uploads arte local: HTTP ${uploads_status} (esperado: nao 200)."
}

main() {
  detect_project_dir
  require_root_for_system_changes

  [ -d "$PROJECT_DIR" ] || fail "pasta do projeto nao encontrada: ${PROJECT_DIR}"

  log "Projeto: ${PROJECT_DIR}"
  log "Usuario app: ${APP_USER}"

  install_system_packages
  validate_node
  detect_env_files
  validate_env_files
  prepare_upload_dirs
  update_code
  install_dependencies
  apply_prisma
  build_apps
  audit_dependencies
  prune_dependencies
  apply_nginx
  apply_fail2ban
  restart_apps
  health_checks

  log 'Deploy concluido com validacoes de seguranca do branch atual.'
}

main "$@"
