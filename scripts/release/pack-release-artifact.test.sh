#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE="$(mktemp -d)"
trap 'rm -rf "$FIXTURE"' EXIT
SHA="0123456789abcdef0123456789abcdef01234567"

mkdir -p \
  "$FIXTURE/backend/dist" \
  "$FIXTURE/backend/prisma/migrations/fixture" \
  "$FIXTURE/backend/scripts" \
  "$FIXTURE/backend/node_modules/.prisma" \
  "$FIXTURE/backend/node_modules/@prisma/client" \
  "$FIXTURE/backend/node_modules/prisma" \
  "$FIXTURE/backend/node_modules/.bin" \
  "$FIXTURE/backend/node_modules/sharp" \
  "$FIXTURE/frontend/.next/standalone" \
  "$FIXTURE/frontend/.next/static" \
  "$FIXTURE/frontend/node_modules/next" \
  "$FIXTURE/frontend/public"

printf 'module.exports = {};\n' > "$FIXTURE/backend/dist/main.js"
printf 'generator client { provider = "prisma-client-js" }\n' > "$FIXTURE/backend/prisma/schema.prisma"
printf '%s\n' '{}' > "$FIXTURE/backend/package.json"
printf '%s\n' '{}' > "$FIXTURE/backend/package-lock.json"
printf '%s\n' '{"version":"6.19.3"}' > "$FIXTURE/backend/node_modules/prisma/package.json"
printf '%s\n' '{"version":"6.19.3"}' > "$FIXTURE/backend/node_modules/@prisma/client/package.json"
printf '%s\n' '{"version":"0.35.3"}' > "$FIXTURE/backend/node_modules/sharp/package.json"
printf '#!/usr/bin/env bash\n' > "$FIXTURE/backend/node_modules/.bin/prisma"
printf 'console.log("backup");\n' > "$FIXTURE/backend/scripts/mysql-backup-before-deploy.js"
printf 'console.log("preflight");\n' > "$FIXTURE/backend/scripts/prisma-deploy-preflight.js"
printf 'console.log("standalone");\n' > "$FIXTURE/frontend/.next/standalone/server.js"
printf '%s\n' '{"version":"15.5.21"}' > "$FIXTURE/frontend/node_modules/next/package.json"
printf 'asset\n' > "$FIXTURE/frontend/.next/static/asset.txt"
printf 'public\n' > "$FIXTURE/frontend/public/asset.txt"
printf 'module.exports = { apps: [] };\n' > "$FIXTURE/ecosystem.release.config.js"

bash "$SCRIPT_DIR/pack-release-artifact.sh" --root "$FIXTURE" --sha "$SHA"

test -f "$FIXTURE/artifacts/release/$SHA/backend/dist/main.js"
test -f "$FIXTURE/artifacts/release/$SHA/frontend/.next/standalone/.next/static/asset.txt"
test -f "$FIXTURE/artifacts/release/$SHA/frontend/.next/standalone/public/asset.txt"
test -f "$FIXTURE/artifacts/release/$SHA/MANIFEST.json"
test -f "$FIXTURE/artifacts/release/comunikapp-release-$SHA.tar.gz"
test -f "$FIXTURE/artifacts/release/SHA256SUMS"
bash "$SCRIPT_DIR/verify-release-artifact.sh" \
  --artifact "$FIXTURE/artifacts/release/comunikapp-release-$SHA.tar.gz" \
  --expected-sha "$SHA"

echo "pack-release-artifact.test.sh: OK"
