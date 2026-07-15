#!/usr/bin/env bash

set -euo pipefail

printf '%s\n' \
  '[fix-migration-history] ERRO: este script foi desativado por seguranca.' \
  '[fix-migration-history] Ele marcava migrations como aplicadas sem validar o schema.' \
  '[fix-migration-history] Use o deploy normal com PRISMA_APPLY=migrate.' \
  '[fix-migration-history] Para diagnostico sem alteracoes:' \
  '[fix-migration-history]   cd backend && npm run db:deploy:preflight -- --audit-legacy'

exit 1
