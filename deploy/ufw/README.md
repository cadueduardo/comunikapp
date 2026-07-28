# UFW — HTTP(S) só via Cloudflare

Script canônico: `apply-cloudflare-only-http.sh`

## O que faz

1. Libera **80/tcp e 443/tcp** apenas para as faixas oficiais da Cloudflare (IPv4 + IPv6).
2. Remove as regras `ALLOW IN Anywhere` de 80/443.
3. **Não** altera SSH (já deve estar fechado; acesso via Tunnel).

## Pré-requisitos

- Túnel SSH funcionando (`ssh comunikapp-vps`)
- Site já atrás do proxy laranja
- Nginx `cloudflare-realip.conf` ativo
- Console/VNC Contabo disponível como recuperação

## Aplicar

```bash
sudo bash /opt/comunikapp/app/deploy/ufw/apply-cloudflare-only-http.sh
```

## Validação

```bash
curl -I https://comunikapp.com.br
curl -I https://api.comunikapp.com.br/lojas/login
curl -I --max-time 10 https://147.93.190.212 --insecure
```

Esperado: domínios `200`/`301`/`401` via Cloudflare; IP direto timeout/recusa.

## Manutenção

Quando a Cloudflare publicar novas faixas, atualize em conjunto:

- `deploy/nginx/cloudflare-realip.conf`
- `deploy/ufw/apply-cloudflare-only-http.sh`

Fontes: https://www.cloudflare.com/ips-v4 e https://www.cloudflare.com/ips-v6
