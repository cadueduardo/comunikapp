# Configurações do Nginx (produção)

Este diretório contém as configurações **canônicas** do Nginx para a VPS do Comunikapp.
**Não edite as configs direto em `/etc/nginx/*`** — altere aqui, faça commit, dê pull
na VPS e recopie. Assim o repositório é a fonte da verdade.

## Arquivos

| Arquivo | Onde instalar |
|---|---|
| `cors-map.conf` | `/etc/nginx/conf.d/cors-map.conf` (vai dentro de `http {}`) |
| `api.comunikapp.com.br.conf` | `/etc/nginx/sites-available/` + symlink em `sites-enabled/` |
| `comunikapp.com.br.conf` | `/etc/nginx/sites-available/` + symlink em `sites-enabled/` |

## Instalação completa (do zero)

```bash
# 1. Copiar para os locais corretos
sudo cp /opt/comunikapp/app/deploy/nginx/cors-map.conf            /etc/nginx/conf.d/cors-map.conf
sudo cp /opt/comunikapp/app/deploy/nginx/api.comunikapp.com.br.conf /etc/nginx/sites-available/
sudo cp /opt/comunikapp/app/deploy/nginx/comunikapp.com.br.conf      /etc/nginx/sites-available/

# 2. Ativar os sites
sudo ln -sf /etc/nginx/sites-available/api.comunikapp.com.br.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/comunikapp.com.br.conf     /etc/nginx/sites-enabled/

# 3. Desativar o default (se existir)
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Confirmar que o nginx.conf inclui conf.d/*.conf e sites-enabled/*
sudo grep -E 'include' /etc/nginx/nginx.conf

# 5. Pré-requisito para o ACME challenge
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# 6. Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx

# 7. Emitir certificados (DNS precisa apontar antes)
sudo certbot --nginx -d api.comunikapp.com.br
sudo certbot --nginx -d comunikapp.com.br -d www.comunikapp.com.br
```

## Validação obrigatória (regra do projeto)

```bash
# Backend local respondendo (NUNCA 502)
curl -i http://127.0.0.1:4001/api/docs

# CORS preflight - 204 com Access-Control-Allow-Origin = https://comunikapp.com.br
curl -i -X OPTIONS https://api.comunikapp.com.br/lojas/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Access-Control-Request-Method: POST"

# CORS no POST real
curl -i -X POST https://api.comunikapp.com.br/lojas/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Content-Type: application/json" \
  -d '{}'

# Não pode haver MAIS DE UM Access-Control-Allow-Origin:
curl -s -I -X OPTIONS https://api.comunikapp.com.br/lojas/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Access-Control-Request-Method: POST" \
  | grep -i 'access-control-allow-origin' | wc -l   # tem que ser 1

# Front respondendo HTTPS
curl -I https://comunikapp.com.br
```

## Como aplicar atualizações depois

```bash
# Na VPS:
sudo -u comunikapp -H bash -lc 'cd /opt/comunikapp/app && git pull --ff-only'
sudo cp /opt/comunikapp/app/deploy/nginx/cors-map.conf              /etc/nginx/conf.d/cors-map.conf
sudo cp /opt/comunikapp/app/deploy/nginx/api.comunikapp.com.br.conf /etc/nginx/sites-available/
sudo cp /opt/comunikapp/app/deploy/nginx/comunikapp.com.br.conf     /etc/nginx/sites-available/
sudo nginx -t && sudo systemctl reload nginx
```

## Por que `proxy_hide_header`?

A regra `deploy-cors-nginx-pm2-guardrails.mdc` exige **um único responsável por CORS**.
Em produção, esse responsável é o Nginx (`CORS_VIA_PROXY=true` no `.env`).

`proxy_hide_header Access-Control-*` no `location /` da API garante que, mesmo se o
backend voltar a enviar CORS por engano, o cliente verá apenas **uma** ocorrência de
`Access-Control-Allow-Origin` — vinda do Nginx, refletindo o `$cors_origin`.
