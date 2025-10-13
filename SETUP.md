# 🚀 Guia de Setup - ComunikApp

Este guia contém instruções completas para configurar o projeto após clonar o repositório ou atualizar para uma nova versão.

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **MySQL** 8.0+
- **PowerShell** (Windows)
- **Git**

---

## 🆕 Setup Inicial (Primeira vez)

### Opção 1: Setup Automático (Recomendado)

Execute o script de setup que faz tudo automaticamente:

```powershell
.\scripts\setup.ps1
```

Este script irá:
- ✅ Instalar dependências do backend e frontend
- ✅ Configurar variáveis de ambiente
- ✅ Gerar Prisma Client
- ✅ Sincronizar schema com banco de dados
- ✅ Verificar configuração

### Opção 2: Setup Manual

Se preferir fazer manualmente:

#### 1. Instalar Dependências

```powershell
# Raiz do projeto
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 2. Configurar Variáveis de Ambiente

```powershell
cd backend
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/comunikapp"
JWT_SECRET="sua-chave-secreta-aqui"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

#### 3. Configurar Banco de Dados

```powershell
# Gerar Prisma Client
npm run db:generate

# Sincronizar schema com banco (sem migrations)
npm run db:push

# OU aplicar migrations (requer permissões)
npm run db:migrate
```

#### 4. Iniciar Servidores

```powershell
# Voltar para raiz e iniciar tudo
cd ..
npm run dev
```

Acesse:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000

---

## 🔄 Atualização do Projeto (Pull/Restore)

Quando você faz `git pull` ou restaura o branch, precisa atualizar dependências e Prisma.

### Opção 1: Script de Atualização Automático

```powershell
.\scripts\update.ps1
```

### Opção 2: Atualização Manual

```powershell
# 1. Atualizar dependências (se package.json mudou)
cd backend
npm install
cd ../frontend  
npm install

# 2. Regenerar Prisma Client (SEMPRE necessário após pull)
cd ../backend
npm run db:generate

# 3. Sincronizar schema do banco
npm run db:push

# 4. Recompilar backend (limpar cache)
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npx tsc

# 5. Reiniciar servidores
cd ..
npm run dev
```

---

## ⚠️ Problemas Comuns

### 1. Erro "Cannot find module"

**Causa:** Prisma Client desatualizado ou dist com código antigo

**Solução:**
```powershell
cd backend
npm run db:generate
Remove-Item -Recurse -Force dist
npx tsc
```

### 2. Frontend não inicia (ERR_CONNECTION_REFUSED)

**Causa:** Conflito de rotas dinâmicas `[versaoId]` vs `[id]`

**Solução:**
```powershell
# Verificar se existe pasta conflitante
Remove-Item -Recurse -Force "frontend\src\app\api\arte-aprovacao\versoes\[versaoId]"

# Reiniciar frontend
cd frontend
npm run dev
```

### 3. Erro Prisma "Shadow database"

**Causa:** Usuário MySQL sem permissão para criar databases

**Solução:** Use `db:push` em vez de `db:migrate`:
```powershell
npm run db:push
```

### 4. Erro "sharp" em upload de imagens

**Causa:** Sharp não compilado para Windows

**Solução:**
```powershell
cd backend
npm rebuild sharp
```

### 5. Tabelas não existem no banco

**Causa:** Schema não foi aplicado ao banco

**Solução:**
```powershell
cd backend
npm run db:push  # Ou db:migrate se tiver permissões
```

---

## 🗂️ Estrutura de Pastas Importantes

```
comunikapp/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   └── arte-aprovacao/     ← Módulo de Arte & Aprovação
│   │   └── prisma/
│   ├── prisma/
│   │   └── schema.prisma            ← Schema do banco
│   └── uploads/
│       └── arte/                    ← Arquivos de arte
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── api/
│   │   │       └── arte-aprovacao/
│   │   │           └── versoes/
│   │   │               └── versao/[id]/  ← Rotas de API (não usar [versaoId]!)
│   │   └── components/
│   │       └── os/
│   │           └── arte-aprovacao/  ← Componentes de Arte
│   └── public/
│
└── scripts/                         ← Scripts de automação
    ├── setup.ps1
    └── update.ps1
```

---

## 📝 Comandos Úteis

### Backend

```powershell
cd backend

# Desenvolvimento
npm run start:dev          # Iniciar em modo watch
npm run build              # Compilar
npm run test               # Testes unitários

# Banco de Dados
npm run db:generate        # Gerar Prisma Client
npm run db:push            # Aplicar schema sem migrations
npm run db:migrate         # Criar e aplicar migrations
npm run db:studio          # Interface visual do banco

# Linting
npm run lint               # Verificar código
npm run format             # Formatar código
```

### Frontend

```powershell
cd frontend

# Desenvolvimento
npm run dev                # Iniciar Next.js
npm run build              # Build de produção
npm run start              # Iniciar produção
```

### Raiz (Full Stack)

```powershell
npm run dev                # Backend + Frontend juntos
npm run dev:test           # Ambiente de teste
```

---

## 🔧 Desenvolvimento

### Trabalhando no Módulo Arte & Aprovação

**Regras importantes:**
- ✅ Editar apenas arquivos em `/modules/arte-aprovacao/`
- ✅ Ler outros módulos quando necessário
- ❌ **NUNCA** alterar `schema.prisma` sem avisar
- ❌ **NUNCA** alterar arquivos globais (`app.module.ts`, etc)

**Rotas dinâmicas do Next.js:**
- ⚠️ Sempre use `versao/[id]` em vez de `[versaoId]` direto
- ⚠️ Evite conflitos de rotas dinâmicas na mesma pasta
- ⚠️ Reinicie o Next.js após criar novas pastas dinâmicas

---

## 🐛 Debug

### Ver logs do backend
Os logs aparecem no terminal com emojis:
- 🔍 Informação
- ✅ Sucesso
- ❌ Erro
- 📤 Upload
- 📥 Download

### Ver logs do frontend
Abra o DevTools (F12) → Console

### Limpar cache completo

```powershell
# Backend
cd backend
Remove-Item -Recurse -Force dist, node_modules/.cache
npm run db:generate
npx tsc

# Frontend  
cd ../frontend
Remove-Item -Recurse -Force .next

# Reiniciar
cd ..
npm run dev
```

---

## 📞 Suporte

Se encontrar problemas não documentados aqui, verifique:
1. **Logs do backend** no terminal
2. **Console do navegador** (F12)
3. **Arquivo de logs** `docs/console.log.md` (para análise)

---

**Última atualização:** 13/10/2025

