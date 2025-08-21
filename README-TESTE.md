# 🧪 Guia de Teste - Comunikapp

Este guia te ajudará a executar o projeto em modo de teste com um banco de dados novo e portas diferentes.

## 🎯 Objetivo

- ✅ Criar banco de dados MySQL novo (`comunikapp_teste`)
- ✅ Executar projeto em portas diferentes (Frontend: 3003, Backend: 3002)
- ✅ Testar o commit específico sem afetar o ambiente principal
- ✅ Banco limpo sem dados existentes

## 📋 Pré-requisitos

- ✅ MySQL instalado e rodando
- ✅ Node.js e npm instalados
- ✅ Projeto clonado no commit `ecff457`

## 🗄️ Passo 1: Criar Banco de Teste

### Opção A: MySQL Workbench
1. Abra o MySQL Workbench
2. Conecte ao seu servidor MySQL
3. Execute o script: `backend/scripts/create-test-database.sql`

### Opção B: Linha de Comando
```bash
# Conectar ao MySQL
mysql -u root -p

# Executar script
source backend/scripts/create-test-database.sql
```

### Opção C: Script Automático
```bash
# No diretório raiz do projeto
cd backend
mysql -u root -p < scripts/create-test-database.sql
```

## ⚙️ Passo 2: Configurar Ambiente de Teste

### Executar Script de Configuração
```bash
# No diretório raiz do projeto
cd backend
node scripts/setup-test-db.js
```

Este script irá:
- ✅ Copiar configuração de teste para `.env`
- ✅ Gerar cliente Prisma
- ✅ Executar migrações iniciais

## 🚀 Passo 3: Executar Projeto de Teste

### Comando Principal
```bash
# No diretório raiz do projeto
npm run dev:test
```

### Comandos Individuais
```bash
# Apenas Frontend (porta 3003)
npm run dev:frontend:test

# Apenas Backend (porta 3002)
npm run dev:backend:test
```

## 🌐 URLs de Acesso

| Serviço | URL | Porta |
|----------|-----|-------|
| **Frontend** | http://localhost:3003 | 3003 |
| **Backend** | http://localhost:3002 | 3002 |
| **Swagger** | http://localhost:3002/api | 3002 |

## 🔧 Configurações de Teste

### Banco de Dados
- **Nome:** `comunikapp_teste`
- **Usuário:** `comunikapp_test`
- **Senha:** `password123`
- **Host:** `localhost:3306`

### Variáveis de Ambiente
- **PORT:** 3002 (Backend)
- **DATABASE_URL:** `mysql://comunikapp_test:password123@localhost:3306/comunikapp_teste`
- **NODE_ENV:** `test`

## 🧹 Limpeza e Reset

### Resetar Banco de Teste
```bash
cd backend
npm run db:reset:estoque
```

### Voltar para Configuração Original
```bash
cd backend
cp .env-corrected .env
```

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
- ✅ Verifique se MySQL está rodando
- ✅ Confirme se o banco `comunikapp_teste` foi criado
- ✅ Verifique usuário e senha no MySQL

### Erro de Porta em Uso
- ✅ Verifique se as portas 3002 e 3003 estão livres
- ✅ Mate processos que possam estar usando essas portas

### Erro de Migração
- ✅ Execute `npm run db:generate` no backend
- ✅ Verifique se o schema Prisma está correto

## 📚 Comandos Úteis

```bash
# Status do projeto
git status
git log --oneline -5

# Dependências
npm install
cd frontend && npm install
cd backend && npm install

# Banco de dados
cd backend
npm run db:generate
npm run db:migrate:estoque
npm run db:studio:estoque

# Testes
cd backend
npm test
npm run test:watch
```

## 🎉 Sucesso!

Se tudo funcionou:
- ✅ Frontend rodando em http://localhost:3003
- ✅ Backend rodando em http://localhost:3002
- ✅ Banco de dados `comunikapp_teste` criado e populado
- ✅ Projeto funcionando com dados limpos

## 🔄 Voltar ao Ambiente Principal

```bash
# Restaurar configuração original
cd backend
cp .env-corrected .env

# Executar projeto principal
cd ..
npm run dev
```

---

**💡 Dica:** Mantenha este README atualizado conforme as configurações mudarem!
