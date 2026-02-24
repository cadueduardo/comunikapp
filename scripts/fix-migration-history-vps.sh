#!/usr/bin/env bash
# Corrige histórico de migrations na VPS quando o schema já foi aplicado
# mas _prisma_migrations está desatualizado (ex.: "Duplicate column" ao rodar migrate deploy).
#
# Uso: na VPS, na raiz do projeto: bash scripts/fix-migration-history-vps.sh
#
# O script marca como "aplicadas" todas as migrations antigas (exceto a última,
# que é a que queremos aplicar de verdade) e em seguida roda prisma migrate deploy.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIGRATIONS_DIR="${ROOT_DIR}/backend/prisma/migrations"

# Última migration (não marcar como aplicada; deixar o deploy aplicá-la)
LAST_MIGRATION="20260222000000_add_tipo_margem_lucro_loja"

cd "${ROOT_DIR}"
echo "[fix-migration-history] Projeto: ${ROOT_DIR}"
echo "[fix-migration-history] Marcando migrations antigas como aplicadas (ignorando erros se já estiverem)..."

# Apenas pastas de migration (não arquivos como .sql soltos)
for path in "${MIGRATIONS_DIR}"/[0-9]*/; do
  [ -d "$path" ] || continue
  name=$(basename "${path%/}")
  [ "$name" = "${LAST_MIGRATION}" ] && continue
  echo "  resolve --applied: ${name}"
  (cd "${ROOT_DIR}/backend" && npx prisma migrate resolve --applied "${name}") 2>/dev/null || true
done

echo "[fix-migration-history] Rodando prisma migrate deploy..."
cd "${ROOT_DIR}/backend"
npx prisma migrate deploy

echo "[fix-migration-history] Prisma generate..."
npx prisma generate

echo "[fix-migration-history] Concluído."
