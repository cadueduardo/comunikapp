#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE="$(mktemp -d)"
trap 'rm -rf "$FIXTURE"' EXIT
SHA="abcdef0123456789abcdef0123456789abcdef01"
PAYLOAD="$FIXTURE/payload"

mkdir -p "$PAYLOAD/backend/dist" "$PAYLOAD/frontend/.next/standalone"
printf 'module.exports = {};\n' > "$PAYLOAD/backend/dist/main.js"
printf 'console.log("standalone");\n' > "$PAYLOAD/frontend/.next/standalone/server.js"
printf '{"sha":"%s","files":[{"path":"backend/dist/main.js","sha256":"fixture"}]}\n' "$SHA" > "$PAYLOAD/MANIFEST.json"

TARBALL="$FIXTURE/comunikapp-release-$SHA.tar.gz"
tar -C "$PAYLOAD" -czf "$TARBALL" .
(
  cd "$FIXTURE"
  sha256sum "$(basename "$TARBALL")" "payload/MANIFEST.json" > SHA256SUMS
)
# O verificador confere o manifesto junto ao tarball; reproduzimos o layout real.
mkdir "$FIXTURE/$SHA"
mv "$PAYLOAD/MANIFEST.json" "$FIXTURE/$SHA/MANIFEST.json"
(
  cd "$FIXTURE"
  sha256sum "$(basename "$TARBALL")" "$SHA/MANIFEST.json" > SHA256SUMS
)

bash "$SCRIPT_DIR/verify-release-artifact.sh" --artifact "$TARBALL" --expected-sha "$SHA"

if bash "$SCRIPT_DIR/verify-release-artifact.sh" --artifact "$TARBALL" --expected-sha "0123456789abcdef0123456789abcdef01234567"; then
  echo "verificação aceitou SHA divergente" >&2
  exit 1
fi

echo "verify-release-artifact.test.sh: OK"
