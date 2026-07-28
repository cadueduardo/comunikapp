#!/usr/bin/env bash
# =============================================================================
# Restringe 80/tcp e 443/tcp no UFW às faixas oficiais da Cloudflare.
# =============================================================================
# Uso (na VPS):
#   sudo bash /opt/comunikapp/app/deploy/ufw/apply-cloudflare-only-http.sh
#
# Ordem segura: ADICIONA allows Cloudflare ANTES de remover Anywhere.
# Fontes: https://www.cloudflare.com/ips-v4 | https://www.cloudflare.com/ips-v6
# Alinhado a deploy/nginx/cloudflare-realip.conf — 2026-07-28
# =============================================================================
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Execute como root: sudo bash $0" >&2
  exit 1
fi

CF_IPV4=(
  173.245.48.0/20
  103.21.244.0/22
  103.22.200.0/22
  103.31.4.0/22
  141.101.64.0/18
  108.162.192.0/18
  190.93.240.0/20
  188.114.96.0/20
  197.234.240.0/22
  198.41.128.0/17
  162.158.0.0/15
  104.16.0.0/13
  104.24.0.0/14
  172.64.0.0/13
  131.0.72.0/22
)

CF_IPV6=(
  2400:cb00::/32
  2606:4700::/32
  2803:f800::/32
  2405:b500::/32
  2405:8100::/32
  2a06:98c0::/29
  2c0f:f248::/32
)

echo "==> Adicionando allows Cloudflare (80 + 443)..."
for cidr in "${CF_IPV4[@]}" "${CF_IPV6[@]}"; do
  ufw allow proto tcp from "${cidr}" to any port 80 comment "Cloudflare HTTP" || true
  ufw allow proto tcp from "${cidr}" to any port 443 comment "Cloudflare HTTPS" || true
done

echo "==> Removendo allows abertos Anywhere em 80/443 (por número, do maior ao menor)..."
mapfile -t TO_DELETE < <(
  ufw status numbered \
    | grep -E '^\[[[:space:]]*[0-9]+\]' \
    | grep -E '(80|443)/tcp' \
    | grep 'Anywhere' \
    | sed -E 's/^\[ *([0-9]+)\].*/\1/' \
    | sort -nr
)

for num in "${TO_DELETE[@]:-}"; do
  [[ -n "${num}" ]] || continue
  echo "Removendo regra #${num}"
  echo y | ufw delete "${num}"
done

echo "==> Estado final do UFW:"
ufw status verbose | head -80

echo
echo "Validar:"
echo "  curl -I https://comunikapp.com.br"
echo "  curl -I --max-time 10 https://<IP_VPS> --insecure   # deve falhar"
