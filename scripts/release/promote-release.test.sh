#!/usr/bin/env bash
# Ensaios do promote em dry-run (sem tocar produção).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

SHA=abcdef0123456789abcdef0123456789abcdef01
FAKE="$TMP/repo"
mkdir -p \
  "$FAKE/backend/dist" \
  "$FAKE/backend/prisma/migrations/m1" \
  "$FAKE/backend/scripts" \
  "$FAKE/backend/node_modules/.bin" \
  "$FAKE/backend/node_modules/.prisma" \
  "$FAKE/backend/node_modules/@prisma/client" \
  "$FAKE/backend/node_modules/prisma" \
  "$FAKE/frontend/.next/standalone" \
  "$FAKE/frontend/.next/static" \
  "$FAKE/frontend/public"

printf 'exports.x=1;\n' > "$FAKE/backend/dist/main.js"
printf '{"name":"backend"}\n' > "$FAKE/backend/package.json"
printf '{}\n' > "$FAKE/backend/package-lock.json"
printf 'generator client { provider = "prisma-client-js" }\n' > "$FAKE/backend/prisma/schema.prisma"
printf '%s\n' '-- noop' > "$FAKE/backend/prisma/migrations/m1/migration.sql"
printf 'console.log(1);\n' > "$FAKE/backend/scripts/mysql-backup-before-deploy.js"
printf 'console.log(1);\n' > "$FAKE/backend/scripts/prisma-deploy-preflight.js"
printf '#!/bin/sh\nexit 0\n' > "$FAKE/backend/node_modules/.bin/prisma"
chmod +x "$FAKE/backend/node_modules/.bin/prisma"
printf '{"version":"6.19.3"}\n' > "$FAKE/backend/node_modules/prisma/package.json"
printf '{"version":"6.19.3"}\n' > "$FAKE/backend/node_modules/@prisma/client/package.json"
printf '{"version":"15.5.22"}\n' > "$FAKE/frontend/package.json"
mkdir -p "$FAKE/frontend/node_modules/next" "$FAKE/backend/node_modules/sharp"
printf '{"version":"15.5.22"}\n' > "$FAKE/frontend/node_modules/next/package.json"
printf '{"version":"0.35.3"}\n' > "$FAKE/backend/node_modules/sharp/package.json"
printf 'console.log("standalone");\n' > "$FAKE/frontend/.next/standalone/server.js"
printf 'x\n' > "$FAKE/frontend/.next/static/x.js"
printf 'y\n' > "$FAKE/frontend/public/y.txt"
cp "$ROOT/ecosystem.release.config.js" "$FAKE/ecosystem.release.config.js"

bash "$ROOT/scripts/release/pack-release-artifact.sh" --root "$FAKE" --sha "$SHA"
TAR="$FAKE/artifacts/release/comunikapp-release-$SHA.tar.gz"
[[ -f "$TAR" ]]

bash "$ROOT/scripts/release/promote-release.sh" \
  --artifact "$TAR" \
  --expected-sha "$SHA" \
  --root "$TMP/srv" \
  --dry-run

[[ ! -e "$TMP/srv/current" ]] || { echo "dry-run nao deve criar current"; exit 1; }
echo "promote-release.test.sh: OK"
