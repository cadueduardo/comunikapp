#!/usr/bin/env bash
# =============================================================================
# Backup automático do MySQL para o ComunikApp
# =============================================================================
# Princípios:
#   - Roda como usuário `comunikapp` (NÃO root)
#   - Lê credenciais de ~/.my.cnf (com chmod 600), sem expor senha em ENV
#   - Usa --single-transaction (não trava o banco InnoDB)
#   - Sai com código != 0 em qualquer falha (cron detecta)
#   - Idempotente: pode ser executado várias vezes
#
# Layout dos backups:
#   /opt/comunikapp/backups/mysql/
#       daily/   - 7 últimos dias (rotação automática)
#       weekly/  - 4 últimas semanas (cópia feita aos domingos)
#       backup.log    - log estruturado de execução
#       cron.log      - stdout/stderr do cron
#
# Instalação na VPS (uma vez):
#   1) Criar credenciais MySQL para o backup:
#        sudo -u comunikapp -H bash -c 'umask 077 && cat > ~/.my.cnf << EOF
#        [client]
#        user=comunikapp
#        password=SUA_SENHA_MYSQL
#        host=127.0.0.1
#        port=3306
#        EOF'
#
#   2) Criar diretório de destino:
#        sudo mkdir -p /opt/comunikapp/backups/mysql/{daily,weekly}
#        sudo chown -R comunikapp:comunikapp /opt/comunikapp/backups
#        sudo chmod 750 /opt/comunikapp/backups/mysql
#
#   3) Tornar o script executável:
#        chmod +x /opt/comunikapp/app/scripts/backup-mysql.sh
#
#   4) Instalar o cron:
#        sudo cp /opt/comunikapp/app/deploy/cron/comunikapp-backup \
#                /etc/cron.d/comunikapp-backup
#        sudo chmod 644 /etc/cron.d/comunikapp-backup
#
#   5) Validar manualmente:
#        sudo -u comunikapp -H /opt/comunikapp/app/scripts/backup-mysql.sh
#
# =============================================================================

set -euo pipefail

# --- Configuração (override via env) -----------------------------------------
DB_NAME="${DB_NAME:-comunikapp}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/comunikapp/backups/mysql}"
RETENTION_DAILY="${RETENTION_DAILY:-7}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-4}"

# --- Variáveis derivadas -----------------------------------------------------
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
DAY_OF_WEEK="$(date +%u)"   # 1=segunda ... 7=domingo
DAILY_FILE="${BACKUP_ROOT}/daily/${DB_NAME}-${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_ROOT}/backup.log"
MY_CNF="${HOME}/.my.cnf"

# --- Helpers ------------------------------------------------------------------
log() {
  local msg="$(date '+%Y-%m-%d %H:%M:%S') | $*"
  echo "${msg}"
  echo "${msg}" >> "${LOG_FILE}" 2>/dev/null || true
}

die() {
  log "ERRO: $*"
  exit 1
}

# --- Pre-flight checks --------------------------------------------------------
[ -f "${MY_CNF}" ] || die "Arquivo de credenciais não encontrado: ${MY_CNF}. Veja o cabeçalho deste script."

if [ "$(stat -c '%a' "${MY_CNF}" 2>/dev/null)" != "600" ]; then
  die "Permissão de ${MY_CNF} insegura (deve ser 600). Rode: chmod 600 ${MY_CNF}"
fi

command -v mysqldump >/dev/null 2>&1 || die "mysqldump não encontrado. Instale: sudo apt install mysql-client"
command -v gzip >/dev/null 2>&1 || die "gzip não encontrado."

mkdir -p "${BACKUP_ROOT}/daily" "${BACKUP_ROOT}/weekly"

# --- Backup -------------------------------------------------------------------
log "===== Backup iniciado ====="
log "Banco:    ${DB_NAME}"
log "Destino:  ${DAILY_FILE}"
log "Hora:     $(date -Iseconds)"

set +e
mysqldump \
  --defaults-file="${MY_CNF}" \
  --single-transaction \
  --quick \
  --no-tablespaces \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  --default-character-set=utf8mb4 \
  "${DB_NAME}" 2>>"${LOG_FILE}" | gzip > "${DAILY_FILE}"
DUMP_EXIT=${PIPESTATUS[0]}
GZIP_EXIT=${PIPESTATUS[1]}
set -e

if [ "${DUMP_EXIT}" -ne 0 ] || [ "${GZIP_EXIT}" -ne 0 ]; then
  rm -f "${DAILY_FILE}"
  die "mysqldump falhou (dump=${DUMP_EXIT}, gzip=${GZIP_EXIT}). Arquivo parcial removido."
fi

[ -s "${DAILY_FILE}" ] || die "Arquivo de backup vazio: ${DAILY_FILE}"

SIZE=$(du -h "${DAILY_FILE}" | cut -f1)
log "OK   Backup diário gerado (tamanho=${SIZE})."

# --- Cópia semanal (domingos) -------------------------------------------------
if [ "${DAY_OF_WEEK}" = "7" ]; then
  WEEKLY_FILE="${BACKUP_ROOT}/weekly/${DB_NAME}-${TIMESTAMP}.sql.gz"
  cp "${DAILY_FILE}" "${WEEKLY_FILE}"
  log "OK   Cópia semanal criada: ${WEEKLY_FILE}"
fi

# --- Rotação ------------------------------------------------------------------
DELETED_DAILY=$(find "${BACKUP_ROOT}/daily/" -maxdepth 1 -type f -name "${DB_NAME}-*.sql.gz" \
  -mtime "+${RETENTION_DAILY}" -print -delete 2>/dev/null | wc -l)
DELETED_WEEKLY=$(find "${BACKUP_ROOT}/weekly/" -maxdepth 1 -type f -name "${DB_NAME}-*.sql.gz" \
  -mtime "+$(( RETENTION_WEEKLY * 7 ))" -print -delete 2>/dev/null | wc -l)
log "OK   Rotação concluída (diários removidos=${DELETED_DAILY}, semanais removidos=${DELETED_WEEKLY})."

# --- Resumo -------------------------------------------------------------------
TOTAL_DAILY=$(find "${BACKUP_ROOT}/daily/" -maxdepth 1 -type f -name "${DB_NAME}-*.sql.gz" | wc -l)
TOTAL_WEEKLY=$(find "${BACKUP_ROOT}/weekly/" -maxdepth 1 -type f -name "${DB_NAME}-*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_ROOT}" 2>/dev/null | cut -f1)
log "Inventário: daily=${TOTAL_DAILY}, weekly=${TOTAL_WEEKLY}, ocupação=${TOTAL_SIZE}"
log "===== Backup finalizado com sucesso ====="
