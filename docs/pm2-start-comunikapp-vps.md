# Subir Comunikapp (backend + frontend) no PM2 na VPS

> **Princípios de segurança (obrigatórios):**
> - O PM2 **NUNCA** roda como root.
> - Usuário de aplicação: **`comunikapp`** com home **`/opt/comunikapp`**.
> - Projeto em **`/opt/comunikapp/app`** (dono `comunikapp:comunikapp`).
> - Apps escutam apenas em `127.0.0.1` (`HOST=127.0.0.1`). O Nginx é o único exposto na internet.
> - Portas em produção: API = **4001**, site = **3001**.

---

## 0. Pré-requisitos (uma única vez, como root)

```bash
# Usuário de aplicação - home em /opt/comunikapp (NÃO em /home/comunikapp)
sudo adduser --system --group --home /opt/comunikapp --shell /bin/bash comunikapp

# Pasta do projeto
sudo mkdir -p /opt/comunikapp/app
sudo chown -R comunikapp:comunikapp /opt/comunikapp

# Habilitar PM2 startup via systemd para o usuário comunikapp.
# Este comando deve ser rodado como root e gera uma linha para executar — execute-a.
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u comunikapp --hp /opt/comunikapp
```

> A partir deste ponto, **todos os comandos do deploy rodam como `comunikapp`**.
> Forma recomendada: `sudo -u comunikapp -H bash -lc '<comando>'`.

---

## 1. Instalar PM2 disponível para o usuário (uma vez)

```bash
# Instale o pm2 globalmente no sistema (ou via nvm dentro do home do usuário)
sudo npm install -g pm2
sudo -u comunikapp -H pm2 -v
```

---

## 2. Clonar o projeto (limpando qualquer instalação anterior)

```bash
# Limpa eventual instalação anterior (CUIDADO: apaga código, NÃO o .env se estiver em outro path)
sudo rm -rf /opt/comunikapp/app
sudo -u comunikapp -H git clone https://github.com/cadueduardo/comunikapp.git /opt/comunikapp/app

# Checkout do branch atual e pull seguro
sudo -u comunikapp -H bash -lc '
  cd /opt/comunikapp/app &&
  git checkout feature/rateio-por-setor &&
  git pull --ff-only
'
```

---

## 3. Configurar `.env` (com segredos **novos** — nunca reutilizar antigos)

```bash
# Copiar templates
sudo -u comunikapp -H cp /opt/comunikapp/app/backend/.env.production.example /opt/comunikapp/app/backend/.env
sudo -u comunikapp -H cp /opt/comunikapp/app/frontend/.env.production.example /opt/comunikapp/app/frontend/.env.production

# Editar e preencher os valores reais (JWT_SECRET, DATABASE_URL, MAIL_*, ESTOQUE_INTERNAL_API_TOKEN, etc.)
# Sugestão para gerar segredos fortes:
#   openssl rand -base64 48   (JWT_SECRET)
#   openssl rand -hex 32      (tokens internos)
sudo -u comunikapp -H nano /opt/comunikapp/app/backend/.env
sudo -u comunikapp -H nano /opt/comunikapp/app/frontend/.env.production

# Permissões: só o dono lê
sudo chown comunikapp:comunikapp /opt/comunikapp/app/backend/.env /opt/comunikapp/app/frontend/.env.production
sudo chmod 600 /opt/comunikapp/app/backend/.env /opt/comunikapp/app/frontend/.env.production
```

---

## 4. Instalar dependências + build + migrate (como `comunikapp`)

```bash
sudo -u comunikapp -H bash -lc '
  set -e
  cd /opt/comunikapp/app/backend
  npm ci
  npx prisma generate
  npx prisma migrate deploy
  npm run build

  cd /opt/comunikapp/app/frontend
  npm ci
  npm run build
'
```

---

## 5. Subir as apps com o `ecosystem.config.js`

```bash
sudo -u comunikapp -H bash -lc '
  cd /opt/comunikapp/app
  pm2 start ecosystem.config.js
  pm2 save
  pm2 list
'
```

> Alternativa manual (somente se o `ecosystem.config.js` não existir):
>
> ```bash
> sudo -u comunikapp -H bash -lc '
>   cd /opt/comunikapp/app/backend
>   HOST=127.0.0.1 PORT=4001 NODE_ENV=production pm2 start dist/main.js --name comunikapp-backend
>
>   cd /opt/comunikapp/app/frontend
>   HOST=127.0.0.1 PORT=3001 NODE_ENV=production pm2 start node_modules/next/dist/bin/next \
>     --name comunikapp-frontend -- start -H 127.0.0.1 -p 3001
>
>   pm2 save
> '
> ```

---

## 6. Validações obrigatórias (antes de declarar deploy OK)

```bash
# 6.1 Processos no PM2 rodando como o usuário 'comunikapp', nunca root
sudo -u comunikapp -H pm2 list
ps -o user=,pid=,cmd= -C node | head

# 6.2 Bind LOCAL (deve ser 127.0.0.1, nunca 0.0.0.0)
sudo ss -tlnp | grep -E '3001|4001'
# Esperado:
#   LISTEN ... 127.0.0.1:3001 ... node
#   LISTEN ... 127.0.0.1:4001 ... node

# 6.3 Backend respondendo localmente (nunca 502)
curl -i http://127.0.0.1:4001/api/docs

# 6.4 Front respondendo localmente
curl -I http://127.0.0.1:3001

# 6.5 CORS via Nginx (depois de configurar o Nginx e o SSL).
#     A resposta DEVE ter apenas 1 header Access-Control-Allow-Origin.
curl -i -X OPTIONS https://api.comunikapp.com.br/lojas/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Access-Control-Request-Method: POST"
```

---

## 7. Atualizações subsequentes (deploys do dia a dia)

```bash
sudo -u comunikapp -H bash -lc '
  cd /opt/comunikapp/app &&
  ./scripts/deploy-vps.sh
'
```

O script:
- Aborta se for executado como root.
- `git pull --ff-only` no branch padrão (`feature/rateio-por-setor`).
- Build inteligente (só do que mudou).
- `prisma migrate deploy`.
- `pm2 startOrReload ecosystem.config.js --update-env` + `pm2 save`.
- Imprime `pm2 list` no final.

---

## 8. Troubleshooting

| Sintoma | Provável causa | Como confirmar |
|---|---|---|
| `502 Bad Gateway` | App caiu ou bind errado | `sudo -u comunikapp -H pm2 list`, `pm2 logs comunikapp-backend`, `ss -tlnp \| grep 4001` |
| `CORS bloqueado` ou header duplicado | Backend e Nginx adicionando CORS | Conferir `CORS_VIA_PROXY=true` no `.env` e `proxy_hide_header Access-Control-Allow-Origin;` no `location /` do Nginx |
| `EACCES` no PM2 | Algum arquivo do projeto pertence a root | `sudo chown -R comunikapp:comunikapp /opt/comunikapp` |
| Apps escutando em `0.0.0.0` | Faltou `HOST=127.0.0.1` | Conferir `ecosystem.config.js` e `backend/src/main.ts` (deve respeitar `process.env.HOST`) |
| PM2 não sobe após reboot | `pm2 startup` não foi feito ou `pm2 save` não foi executado | Repetir o passo 0 (`pm2 startup ... --hp /opt/comunikapp`) e rodar `pm2 save` |
