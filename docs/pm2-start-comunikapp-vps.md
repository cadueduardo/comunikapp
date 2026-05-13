# Subir Comunikapp (backend + frontend) no PM2 na VPS

> **Princípios de segurança (obrigatórios):**
> - O PM2 **NUNCA** roda como root.
> - O projeto fica em `/opt/comunikapp/app`, com dono `comunikapp:comunikapp`.
> - As apps escutam apenas em `127.0.0.1` (`HOST=127.0.0.1`). O Nginx é o único exposto na internet.
> - Portas em produção: API = **4001**, site = **3001**.

## 0. Pré-requisitos (uma única vez, como root)

```bash
# Usuário de aplicação
sudo adduser --system --group --home /home/comunikapp --shell /bin/bash comunikapp

# Pasta do projeto
sudo mkdir -p /opt/comunikapp/app
sudo chown -R comunikapp:comunikapp /opt/comunikapp

# Permitir que o usuário comunikapp faça PM2 startup via systemd
# (executar AINDA como root; o comando abaixo gera uma linha que o root deve executar)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u comunikapp --hp /home/comunikapp
# Se você instalou o pm2 dentro do home do comunikapp, ajuste o caminho do binário.
```

A partir daqui, **tudo é feito como o usuário `comunikapp`**:

```bash
sudo -iu comunikapp
```

## 1. Instalar PM2 no contexto do usuário (uma vez)

```bash
npm install -g pm2
pm2 -v
```

> Se `npm i -g` exigir root, instale `nvm` em `/home/comunikapp` ou use `npm config set prefix ~/.npm-global`.

## 2. Clonar o projeto

```bash
cd /opt/comunikapp/app
git clone https://github.com/cadueduardo/comunikapp.git .
git checkout feature/rateio-por-setor
```

## 3. Configurar `.env` (com segredos NOVOS — nunca reutilizar antigos)

```bash
cp backend/.env.production.example backend/.env
# Edite e preencha JWT_SECRET, DATABASE_URL, MAIL_*, ESTOQUE_INTERNAL_API_TOKEN, etc.
# Recomendado: gerar com `openssl rand -base64 48`
nano backend/.env

cp frontend/.env.production.example frontend/.env.production
nano frontend/.env.production
```

## 4. Instalar dependências + build + migrate

```bash
cd /opt/comunikapp/app/backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

cd /opt/comunikapp/app/frontend
npm ci
npm run build
```

## 5. Subir as apps com o `ecosystem.config.js` (recomendado)

```bash
cd /opt/comunikapp/app
pm2 start ecosystem.config.js
pm2 save
pm2 list
```

> Alternativa manual (somente se o `ecosystem.config.js` não existir):
>
> ```bash
> cd /opt/comunikapp/app/backend
> HOST=127.0.0.1 PORT=4001 NODE_ENV=production pm2 start dist/main.js --name comunikapp-backend
>
> cd /opt/comunikapp/app/frontend
> HOST=127.0.0.1 PORT=3001 NODE_ENV=production pm2 start npm --name comunikapp-frontend -- start
> pm2 save
> ```

## 6. Validações obrigatórias (antes de declarar deploy OK)

```bash
# 6.1 Processos no PM2 rodando como o usuário 'comunikapp', nunca root
pm2 list
ps -o user=,pid=,cmd= -C node | head

# 6.2 Bind LOCAL (deve ser 127.0.0.1, nunca 0.0.0.0)
sudo ss -tlnp | grep -E '3001|4001'
# Esperado:
# LISTEN ... 127.0.0.1:3001 ... node
# LISTEN ... 127.0.0.1:4001 ... node

# 6.3 Backend respondendo localmente (nunca 502)
curl -i http://127.0.0.1:4001/api/docs

# 6.4 CORS via Nginx (apenas 1 Access-Control-Allow-Origin)
curl -i -X OPTIONS https://api.comunikapp.com.br/lojas/login \
  -H "Origin: https://comunikapp.com.br" \
  -H "Access-Control-Request-Method: POST"
```

## 7. Atualizações subsequentes

Use o script de deploy (também roda como `comunikapp`, nunca root):

```bash
sudo -iu comunikapp
cd /opt/comunikapp/app
./scripts/deploy-vps.sh
```

## 8. Troubleshooting

| Sintoma | Provável causa | Como confirmar |
|---|---|---|
| `502 Bad Gateway` | App caiu ou bind errado | `pm2 list`, `pm2 logs comunikapp-backend`, `ss -tlnp \| grep 4001` |
| `CORS bloqueado` | Headers duplicados (Nest + Nginx) | Conferir `CORS_VIA_PROXY=true` no `.env` e `proxy_hide_header` no Nginx |
| `EACCES` no PM2 | Algum arquivo do projeto pertence a root | `sudo chown -R comunikapp:comunikapp /opt/comunikapp` |
| Apps escutando em `0.0.0.0` | Faltou `HOST=127.0.0.1` ou bind hardcoded | Conferir `ecosystem.config.js` e `backend/src/main.ts` |
