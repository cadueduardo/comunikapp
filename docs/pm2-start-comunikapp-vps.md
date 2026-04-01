# Subir Comunikapp (backend + frontend) no PM2 na VPS

Quando `pm2 list` não mostra `comunikapp-backend` e `comunikapp-frontend`, use os comandos abaixo.
O Nginx espera: API em **4001**, site em **3001**.

## 1. Ir para a pasta do projeto

```bash
cd /opt/comunikapp
```

## 2. Adicionar e iniciar o backend (API – porta 4001)

```bash
sudo pm2 start backend/dist/main.js --name comunikapp-backend --cwd /opt/comunikapp/backend -- --env PORT=4001
```

Se o PM2 pedir variável de ambiente de outra forma, use:

```bash
cd /opt/comunikapp/backend
sudo PORT=4001 pm2 start dist/main.js --name comunikapp-backend
cd /opt/comunikapp
```

## 3. Adicionar e iniciar o frontend (site – porta 3001)

```bash
cd /opt/comunikapp/frontend
sudo PORT=3001 pm2 start npm --name comunikapp-frontend -- start
cd /opt/comunikapp
```

## 4. Salvar a lista do PM2 (para manter após reboot)

```bash
sudo pm2 save
```

(Opcional: `sudo pm2 startup` para subir os apps automaticamente quando o servidor ligar.)

## 5. Conferir

```bash
sudo pm2 list
sudo ss -tlnp | grep -E '3001|4001'
```

Deve aparecer `comunikapp-backend` e `comunikapp-frontend` no PM2 e algo escutando em 3001 e 4001.

Depois teste o login em https://comunikapp.com.br.
