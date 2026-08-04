#!/usr/bin/env bash
# Promove um artefato já validado. Nunca instala, poda ou compila dentro da VPS.
set -euo pipefail

ARTIFACT=""
EXPECTED_SHA=""
ROOT="/srv/apps/comunikapp"
DRY_RUN=0
SKIP_MIGRATE=0
CONTINGENCY_KILLSWITCH=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --artifact) ARTIFACT="$2"; shift 2 ;;
    --expected-sha) EXPECTED_SHA="$2"; shift 2 ;;
    --root) ROOT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --skip-migrate) SKIP_MIGRATE=1; shift ;;
    --contingency-killswitch) CONTINGENCY_KILLSWITCH=1; shift ;;
    *) echo "Uso: $0 --artifact TAR --expected-sha SHA --root DIRETORIO [--dry-run] [--skip-migrate] [--contingency-killswitch]" >&2; exit 2 ;;
  esac
done

fail() { echo "[promote-release] ERRO: $*" >&2; exit 1; }
log() { echo "[promote-release] $*"; }
run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "dry-run: $(printf '%q ' "$@")"
  else
    "$@"
  fi
}
[[ -n "$ARTIFACT" && -n "$EXPECTED_SHA" ]] || fail "artifact e expected-sha são obrigatórios."
[[ "$EXPECTED_SHA" =~ ^[0-9a-fA-F]{40}$ ]] || fail "expected-sha deve ter 40 caracteres hexadecimais."
EXPECTED_SHA="${EXPECTED_SHA,,}"
ARTIFACT="$(cd "$(dirname "$ARTIFACT")" && pwd)/$(basename "$ARTIFACT")"
RELEASES_DIR="$ROOT/releases"
RELEASE_DIR="$RELEASES_DIR/$EXPECTED_SHA"
SHARED_ENV="$ROOT/shared/env"
BACKEND_ENV="$SHARED_ENV/backend.env"
FRONTEND_ENV="$SHARED_ENV/frontend.env"
UPLOADS_DIR="$ROOT/shared/uploads"

bash "$SCRIPT_DIR/verify-release-artifact.sh" --artifact "$ARTIFACT" --expected-sha "$EXPECTED_SHA"

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "dry-run validou o artefato; nenhuma alteração em $ROOT foi realizada."
  log "dry-run promoveria para $RELEASE_DIR e trocaria current atomicamente."
  exit 0
fi

[[ -f "$BACKEND_ENV" ]] || fail "env compartilhado do backend ausente: $BACKEND_ENV"
[[ -f "$FRONTEND_ENV" ]] || fail "env compartilhado do frontend ausente: $FRONTEND_ENV"
[[ -d "$UPLOADS_DIR" ]] || fail "uploads compartilhados ausentes: $UPLOADS_DIR"
mkdir -p "$RELEASES_DIR" "$ROOT/.pm2/logs"

if [[ -e "$RELEASE_DIR" ]]; then
  [[ -f "$RELEASE_DIR/MANIFEST.json" ]] || fail "release existente sem manifesto: $RELEASE_DIR"
  EXISTING_SHA="$(node -p "JSON.parse(require('fs').readFileSync('$RELEASE_DIR/MANIFEST.json')).sha")"
  [[ "$EXISTING_SHA" == "$EXPECTED_SHA" ]] || fail "release existente diverge do SHA solicitado."
  log "release já extraída; preservando diretório imutável."
else
  STAGING_DIR="$RELEASES_DIR/.${EXPECTED_SHA}.staging.$$"
  trap 'rm -rf "$STAGING_DIR"' EXIT
  mkdir "$STAGING_DIR"
  tar -xzf "$ARTIFACT" -C "$STAGING_DIR"
  mv "$STAGING_DIR" "$RELEASE_DIR"
  trap - EXIT
fi

ln -sfn "$BACKEND_ENV" "$RELEASE_DIR/backend/.env"
ln -sfn "$FRONTEND_ENV" "$RELEASE_DIR/frontend/.next/standalone/.env.production"
ln -sfn "$UPLOADS_DIR" "$RELEASE_DIR/backend/uploads"

if [[ "$CONTINGENCY_KILLSWITCH" -eq 1 ]]; then
  TMP_ENV="$BACKEND_ENV.tmp.$$"
  awk '!/^[[:space:]]*ORCAMENTOS_ACEITE_PUBLICO_DESABILITADO=/' "$BACKEND_ENV" > "$TMP_ENV"
  printf '\nORCAMENTOS_ACEITE_PUBLICO_DESABILITADO=true\n' >> "$TMP_ENV"
  chmod --reference="$BACKEND_ENV" "$TMP_ENV"
  mv "$TMP_ENV" "$BACKEND_ENV"
  log "contingência fail-closed ativada no env compartilhado."
fi

[[ -f "$RELEASE_DIR/backend/dist/main.js" ]] || fail "backend compilado ausente após extração."
[[ -f "$RELEASE_DIR/frontend/.next/standalone/server.js" ]] || fail "server standalone ausente após extração."
# Apenas sintaxe — NÃO carregar dist/main.js (subiria o Nest e travaria o promote).
node --check "$RELEASE_DIR/backend/dist/main.js" || fail "dist/main.js falhou em node --check."
node --check "$RELEASE_DIR/frontend/.next/standalone/server.js" || fail "server.js falhou em node --check."

# Os comandos abaixo carregam backend/.env (link para shared/env/backend.env)
# pelo dotenv/Prisma. Não fazemos `source`: senha com metacaracteres quebraria o shell.

# Garante que o cwd do backup/preflight enxergue o .env linkado.
export DOTENV_CONFIG_PATH="$RELEASE_DIR/backend/.env"
node "$RELEASE_DIR/backend/scripts/mysql-backup-before-deploy.js"
if [[ "$SKIP_MIGRATE" -eq 0 ]]; then
  (
    cd "$RELEASE_DIR/backend"
    node scripts/prisma-deploy-preflight.js --apply
    ./node_modules/.bin/prisma migrate deploy
  )
else
  log "migrations ignoradas por --skip-migrate."
fi

# current fica em $ROOT/current (não em releases/current — legado histórico é diretório).
if [[ -e "$ROOT/current" && ! -L "$ROOT/current" ]]; then
  fail "\$ROOT/current existe e não é symlink. Remova/renomeie o diretório legado antes da promoção."
fi
ln -sfn "releases/$EXPECTED_SHA" "$ROOT/current.new"
mv -Tf "$ROOT/current.new" "$ROOT/current"
PM2_HOME="$ROOT/.pm2" pm2 startOrReload "$ROOT/current/ecosystem.release.config.js" --update-env

# A API pode negar a rota sem credencial; qualquer resposta HTTP comprova escuta.
# Falha de conexão continua abortando o promote.
curl --silent --show-error --output /dev/null --write-out 'BE_HTTP=%{http_code}\n' "http://127.0.0.1:4001/lojas/health" || fail "health backend falhou"
curl --silent --show-error --output /dev/null --write-out 'FE_HTTP=%{http_code}\n' "http://127.0.0.1:3001/" || fail "health frontend falhou"
log "promoção concluída: $EXPECTED_SHA"
