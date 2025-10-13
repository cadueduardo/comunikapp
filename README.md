# 🎨 ComunikApp

> Sistema SaaS Modular para Gestão de Comunicação Visual

Sistema completo de gestão para empresas de comunicação visual, com arquitetura modular, multi-tenant e marketplace interno de funcionalidades.

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Setup Inicial](#-setup-inicial)
- [Desenvolvimento](#-desenvolvimento)
- [Módulos](#-módulos)
- [Contribuindo](#-contribuindo)
- [Documentação](#-documentação)

---

## 🎯 Sobre o Projeto

O **ComunikApp** é uma plataforma SaaS voltada para pequenas e médias empresas de comunicação visual. O sistema oferece modularidade total, permitindo que cada cliente instale apenas os módulos necessários para seu negócio.

### Características Principais

- 🧩 **Modularidade Total** - Cada funcionalidade é um módulo independente
- 🏢 **Multi-Tenant** - Ambientes isolados por loja
- 🛒 **Marketplace Interno** - Instalação sob demanda de módulos
- 📱 **Responsivo** - Interface adaptada para desktop, tablet e mobile
- 🔒 **Seguro** - Isolamento completo entre módulos e tenants
- 🚀 **Escalável** - Arquitetura preparada para crescimento

---

## 🛠️ Tecnologias

### Frontend
- **Framework:** Next.js 15.3 (React 19) com Turbopack
- **Linguagem:** TypeScript 5.4
- **Estilização:** Tailwind CSS
- **Componentes:** shadcn/ui, Aceternity UI, Magic UI
- **Formulários:** React Hook Form + Zod
- **Estado:** React Query

### Backend
- **Framework:** NestJS 11 (Node.js 20)
- **Linguagem:** TypeScript 5.4
- **Banco de Dados:** MySQL 8.0
- **ORM:** Prisma 6.16
- **Autenticação:** JWT (Passport)
- **Upload:** Multer + Sharp
- **Email:** Nodemailer

### Ferramentas
- **Versionamento:** Git
- **CI/CD:** GitHub Actions
- **Testes:** Jest
- **Documentação:** OpenAPI/Swagger
- **Linting:** ESLint + Prettier

---

## 🏗️ Arquitetura

### Estrutura de Pastas

```
comunikapp/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── modules/           # Módulos do sistema
│   │   │   ├── arte-aprovacao/    # Arte & Aprovação
│   │   │   ├── estoque/           # Controle de Estoque
│   │   │   ├── orcamentos/        # Orçamentos
│   │   │   ├── os/                # Ordens de Serviço
│   │   │   └── ...
│   │   ├── auth/              # Autenticação
│   │   ├── prisma/            # Prisma Service
│   │   └── config/            # Configurações
│   ├── prisma/
│   │   └── schema.prisma      # Schema do banco
│   └── uploads/               # Arquivos enviados
│
├── frontend/                   # App Next.js
│   ├── src/
│   │   ├── app/               # App Router (Next.js 15)
│   │   │   ├── api/           # API Routes (proxy)
│   │   │   └── ...            # Páginas
│   │   ├── components/        # Componentes React
│   │   │   ├── ui/            # Componentes base
│   │   │   └── [modulo]/      # Componentes por módulo
│   │   └── lib/               # Utilitários
│   └── public/                # Arquivos estáticos
│
├── docs/                       # Documentação
│   ├── arte-aprovacao/        # Docs do módulo
│   ├── premissas melhores praticas.md
│   ├── arquitetura-modulos.md
│   └── ...
│
└── scripts/                    # Scripts de automação
    ├── setup.ps1              # Setup inicial
    └── update.ps1             # Atualização
```

### Princípios Arquiteturais

1. **Modularidade** - Cada módulo é independente e plugável
2. **Isolamento** - Multi-tenant com dados segregados por loja
3. **Clean Architecture** - Separação clara de responsabilidades
4. **API First** - Backend expõe APIs REST documentadas
5. **Type Safety** - TypeScript em todo o projeto

---

## 🚀 Setup Inicial

### Pré-requisitos

- Node.js 18+
- MySQL 8.0+
- Git
- PowerShell (Windows)

### Instalação Automática (Recomendado)

```powershell
# 1. Clonar repositório
git clone https://github.com/cadueduardo/comunikapp.git
cd comunikapp

# 2. Executar setup automático
.\scripts\setup.ps1

# 3. Iniciar projeto
npm run dev
```

**Acesse:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

### Instalação Manual

Veja instruções detalhadas em [`SETUP.md`](./SETUP.md)

---

## 💻 Desenvolvimento

### Comandos Principais

```powershell
# Iniciar desenvolvimento (backend + frontend)
npm run dev

# Apenas backend
npm run dev:backend

# Apenas frontend
npm run dev:frontend

# Testes
cd backend && npm test

# Build de produção
cd backend && npm run build
cd frontend && npm run build
```

### Atualização após Git Pull

```powershell
# Automático
.\scripts\update.ps1

# Manual
cd backend
npm install                # Se package.json mudou
npm run db:generate        # Sempre necessário
npm run db:push            # Se schema mudou
npx tsc                    # Recompilar
```

### Trabalhando com Prisma

```powershell
cd backend

# Gerar Prisma Client
npm run db:generate

# Aplicar mudanças no banco (sem migrations)
npm run db:push

# Criar migration
npm run db:migrate

# Interface visual do banco
npm run db:studio
```

---

## 📦 Módulos

### Módulos Implementados

| Módulo | Status | Descrição |
|--------|--------|-----------|
| 🎨 **Arte & Aprovação** | ✅ Ativo | Workflow de aprovação de artes com versionamento |
| 📋 **Orçamentos** | ✅ Ativo | Geração e aprovação de orçamentos |
| 🏭 **Ordens de Serviço** | ✅ Ativo | Gestão de OS e produção |
| 📦 **Estoque** | ✅ Ativo | Controle de insumos e movimentações |
| 👥 **CRM** | ✅ Ativo | Cadastro e gestão de clientes |
| ⚙️ **PCP** | 🚧 Em Dev | Planejamento e controle de produção |
| 💰 **Financeiro** | 📋 Planejado | Contas a pagar/receber |
| 📊 **Relatórios** | 📋 Planejado | Relatórios e dashboards |

### Estrutura de um Módulo

Cada módulo segue a estrutura:

```
backend/src/modules/[nome-modulo]/
├── controllers/           # Endpoints da API
├── services/             # Lógica de negócio
├── dto/                  # Data Transfer Objects
├── entities/             # (Opcional) Entidades
├── guards/               # (Opcional) Guards específicos
└── [nome-modulo].module.ts

frontend/src/components/[nome-modulo]/
├── components/           # Componentes React
├── hooks/               # Custom hooks
└── types/               # Tipos TypeScript
```

---

## 🤝 Contribuindo

### Workflow de Branches

- `main` - Produção (protegido)
- `develop` - Desenvolvimento (integração)
- `feature/*` - Novas funcionalidades
- `fix/*` - Correções de bugs
- `hotfix/*` - Correções urgentes

### Regras de Desenvolvimento

1. **Módulo Arte & Aprovação**
   - ✅ Editar apenas arquivos em `/modules/arte-aprovacao/`
   - ❌ **NUNCA** alterar `schema.prisma` sem avisar
   - ❌ **NUNCA** modificar arquivos globais

2. **Código**
   - Services: máximo 400 linhas
   - Controllers: máximo 200 linhas
   - Cobertura de testes: mínimo 80%

3. **Commits**
   - Usar [Conventional Commits](https://www.conventionalcommits.org/)
   - Exemplos: `feat:`, `fix:`, `docs:`, `chore:`

### Pull Requests

1. Criar PR para `develop`
2. Passar em todos os checks do CI/CD
3. Code review obrigatório
4. Squash merge recomendado

---

## 📚 Documentação

### Documentos Principais

- 📖 [`SETUP.md`](./SETUP.md) - Guia completo de configuração
- 🎨 [`docs/arte-aprovacao/`](./docs/arte-aprovacao/) - Módulo Arte & Aprovação
- 🏗️ [`docs/arquitetura-modulos.md`](./docs/arquitetura-modulos.md) - Arquitetura
- ⚙️ [`docs/premissas melhores praticas.md`](./docs/premissas%20melhores%20praticas.md) - Boas práticas
- 🔧 [`scripts/README.md`](./scripts/README.md) - Scripts de automação

### API Documentation

Quando o backend estiver rodando:
- Swagger UI: http://localhost:4000/api/docs
- OpenAPI JSON: http://localhost:4000/api/docs-json

### Arquitetura Técnica

O sistema utiliza:
- **Backend NestJS** com módulos independentes
- **Prisma ORM** para acesso type-safe ao banco
- **Next.js App Router** para frontend moderno
- **API Routes** como proxy para o backend

Veja mais detalhes em [`docs/pilha-tecnologica.md`](./docs/pilha-tecnologica.md)

---

## ⚠️ Problemas Comuns

### Erro "Cannot find module"

```powershell
cd backend
npm run db:generate
Remove-Item -Recurse -Force dist
npx tsc
```

### Frontend não inicia (ERR_CONNECTION_REFUSED)

```powershell
# Remover pasta conflitante
Remove-Item -Recurse -Force "frontend\src\app\api\arte-aprovacao\versoes\[versaoId]"

# Reiniciar
npm run dev
```

### Upload de imagens não funciona

```powershell
cd backend
npm rebuild sharp
```

**Mais soluções:** [`SETUP.md`](./SETUP.md#problemas-comuns)

---

## 📊 Status do Projeto

- ✅ **Backend:** Funcional com módulos principais
- ✅ **Frontend:** Interface moderna e responsiva
- ✅ **Banco de Dados:** Schema estável
- 🚧 **CI/CD:** Em implementação
- 📋 **Testes:** Em desenvolvimento

---

## 📝 Licença

Este projeto é privado e proprietário.

---

## 👥 Time

- **Desenvolvedor:** Carlos Eduardo ([@cadueduardo](https://github.com/cadueduardo))

---

## 🆘 Suporte

Para problemas ou dúvidas:

1. Consulte a [documentação](./docs/)
2. Verifique [problemas comuns](./SETUP.md#problemas-comuns)
3. Abra uma issue no repositório

---

**Última atualização:** Outubro 2025 | **Versão:** 1.0.0

