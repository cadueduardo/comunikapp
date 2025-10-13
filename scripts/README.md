# Scripts de Automação

Esta pasta contém scripts PowerShell para automatizar tarefas comuns do projeto.

## 📜 Scripts Disponíveis

### `setup.ps1` - Setup Inicial

**Quando usar:** Após clonar o repositório pela primeira vez.

**O que faz:**
- Instala todas as dependências (raiz, backend, frontend)
- Configura arquivo .env
- Gera Prisma Client
- Sincroniza schema com banco de dados
- Recompila Sharp para Windows
- Compila o backend

**Como executar:**
```powershell
.\scripts\setup.ps1
```

---

### `update.ps1` - Atualizar Projeto

**Quando usar:** Após fazer `git pull` ou restaurar um branch.

**O que faz:**
- Verifica status do Git
- Atualiza dependências (opcional)
- Regenera Prisma Client (sempre necessário)
- Sincroniza schema com banco (opcional)
- Limpa cache e recompila backend
- Recompila Sharp (opcional)
- Remove pastas conflitantes

**Como executar:**
```powershell
.\scripts\update.ps1
```

**Modo interativo:** O script pergunta o que você quer fazer em cada etapa.

---

## ⚙️ Configuração Manual vs Automática

### Automática (Recomendado)
```powershell
# Setup inicial
.\scripts\setup.ps1

# Após atualizar código
.\scripts\update.ps1
```

### Manual
```powershell
# Setup inicial
npm install
cd backend && npm install && npm run db:generate && npm run db:push && npx tsc
cd ../frontend && npm install
cd ..

# Após atualizar código  
cd backend && npm run db:generate && npm run db:push
Remove-Item -Recurse -Force dist
npx tsc
cd ..
```

---

## 🔧 Outros Scripts Úteis

### Limpar Cache Completo
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force dist, node_modules/.cache, tsconfig.*.tsbuildinfo
npm run db:generate

# Frontend
cd ../frontend  
Remove-Item -Recurse -Force .next
```

### Recompilar Sharp
```powershell
cd backend
npm rebuild sharp
```

### Resetar Banco (CUIDADO: Apaga dados!)
```powershell
cd backend
npm run db:migrate -- --reset
```

---

## 📝 Notas Importantes

1. **Sempre execute após `git pull`:**
   - `npm run db:generate` (regenerar Prisma)
   - Verificar se há mudanças no `package.json`

2. **Conflitos de rotas Next.js:**
   - Nunca crie `versoes/[versaoId]` - causa conflito com `[id]`
   - Use sempre `versoes/versao/[id]`

3. **Problemas com Sharp:**
   - No Windows, sempre executar `npm rebuild sharp` após instalar
   - Necessário para upload e processamento de imagens

4. **Prisma Client:**
   - É gerado em `node_modules/@prisma/client`
   - Precisa ser regenerado após qualquer mudança no schema
   - Não fazer commit do cliente gerado

---

**Última atualização:** 13/10/2025


