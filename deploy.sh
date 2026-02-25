#!/usr/bin/env bash
# Atalho para deploy - pode ser executado de qualquer diretório.
# Uso: bash /opt/comunikapp/deploy.sh
# Ou, na raiz do projeto: ./deploy.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${SCRIPT_DIR}/scripts/deploy-vps.sh" "$@"
