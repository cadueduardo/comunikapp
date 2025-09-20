# 🌿 ESTRATÉGIA DE BRANCHES - MÓDULO DE USUÁRIOS

## 🎯 **RECOMENDAÇÃO: BRANCH SEPARADO**

### ⚠️ **POR QUE BRANCH SEPARADO É MELHOR:**

#### **🔍 ANÁLISE DA SITUAÇÃO ATUAL:**
Você está no branch `feature/preview-calculo-multiplos-produtos` trabalhando em:
- ✅ **Orçamentos V2** - Preview de cálculo em tempo real
- ✅ **Motor de cálculo** - WebSocket e preview
- ✅ **Serviços manuais** - Modificações ativas

#### **⚠️ RISCOS DE TRABALHAR NO MESMO BRANCH:**

1. **🚨 CONFLITOS DE DEPENDÊNCIAS:**
   - Usuários usa `AuthModule` que orçamentos também usa
   - Modificações no sistema de auth podem afetar orçamentos
   - Guards de permissões podem interferir no fluxo atual

2. **🚨 MODIFICAÇÕES CRÍTICAS:**
   ```typescript
   // Usuários precisa modificar:
   backend/src/usuarios/usuarios.module.ts    # ← Adicionar JwtModule
   backend/src/auth/                          # ← Pode afetar orçamentos
   backend/src/common/guards/                 # ← Guards compartilhados
   ```

3. **🚨 MULTI-TENANT:**
   ```typescript
   // Correções multi-tenant podem afetar:
   backend/src/usuarios/usuarios.service.ts   # ← Filtros por loja_id
   frontend/src/contexts/UserContext.tsx      # ← Contexto de usuário
   ```

4. **🚨 SISTEMA DE PERMISSÕES:**
   ```typescript
   // Implementação de guards pode afetar:
   backend/src/orcamentos/orcamentos.controller.ts  # ← Orçamentos V2
   backend/src/common/guards/                        # ← Guards globais
   ```

---

## 🌿 **ESTRATÉGIA RECOMENDADA: BRANCH ISOLADO**

### 📋 **ESTRUTURA PROPOSTA:**
```bash
main/master                           # ← Branch principal
├── feature/preview-calculo-multiplos-produtos  # ← Seu trabalho atual (orçamentos V2)
├── feature/modulo-os                 # ← Módulo OS (já criado)
└── feature/usuarios-robusto          # ← NOVO - Ajustes de usuários
```

### 🚀 **SETUP DO NOVO BRANCH:**

#### **1. Criar Branch para Usuários:**
```bash
# Criar branch a partir do main (estado estável)
git checkout main
git pull origin main
git checkout -b feature/usuarios-robusto
git push -u origin feature/usuarios-robusto
```

#### **2. Desenvolvimento Isolado:**
```bash
# Trabalhar apenas em:
backend/src/usuarios/              # ✅ Módulo específico
backend/src/common/guards/         # ✅ Guards compartilhados (cuidado)
frontend/src/app/(main)/usuarios/  # ✅ Páginas específicas

# NÃO TOCAR:
backend/src/orcamentos/            # ❌ Seu trabalho atual
backend/src/auth/auth.service.ts   # ❌ Pode afetar login
frontend/src/contexts/UserContext.tsx # ❌ Usado pelos orçamentos
```

---

## 🔄 **WORKFLOW RECOMENDADO**

### **FASE 1: Desenvolvimento Paralelo**
```bash
# Você continua em:
feature/preview-calculo-multiplos-produtos

# Usuários desenvolvido em:
feature/usuarios-robusto

# Módulo OS aguardando em:
feature/modulo-os
```

### **FASE 2: Merge Coordenado**
```bash
# 1. Finalizar orçamentos V2
git checkout feature/preview-calculo-multiplos-produtos
# ... finalizar trabalho
git merge main  # Resolver conflitos
# Pull Request → main

# 2. Finalizar usuários
git checkout feature/usuarios-robusto  
# ... finalizar trabalho
git merge main  # Trazer orçamentos V2 finalizados
# Pull Request → main

# 3. Finalizar OS
git checkout feature/modulo-os
git merge main  # Trazer tudo finalizado
# Pull Request → main
```

---

## ✅ **VANTAGENS DO BRANCH SEPARADO:**

### 🔒 **ISOLAMENTO TOTAL:**
- ✅ **Zero interferência** com orçamentos V2
- ✅ **Desenvolvimento independente** de cada módulo
- ✅ **Testes isolados** sem afetar funcionalidades
- ✅ **Rollback individual** se necessário

### 🧪 **TESTES SEGUROS:**
- ✅ **Ambiente limpo** para testar permissões
- ✅ **Validação isolada** do sistema multi-tenant
- ✅ **Sem risco** de quebrar orçamentos funcionando

### 🚀 **DESENVOLVIMENTO ÁGIL:**
- ✅ **Commits independentes** para cada módulo
- ✅ **Histórico limpo** e organizado
- ✅ **Code review específico** por módulo
- ✅ **Deploy incremental** quando estiver pronto

---

## 🎯 **CRONOGRAMA SUGERIDO:**

### **AGORA (Semana 1):**
```bash
# Você:
- Continua orçamentos V2 no seu branch
- Foca no preview de cálculo

# Módulo Usuários:
- Criar branch feature/usuarios-robusto
- Implementar conformidade com premissas
- Corrigir multi-tenant
```

### **PRÓXIMAS SEMANAS:**
```bash
# Quando orçamentos V2 estiver estável:
- Merge orçamentos V2 → main
- Finalizar usuários robusto
- Merge usuários → main  
- Merge módulo OS → main (com integrações)
```

---

## 💡 **DECISÃO FINAL:**

**✅ RECOMENDO BRANCH SEPARADO** pelos seguintes motivos:

1. **🔒 Segurança** - Zero risco para orçamentos V2
2. **🧪 Qualidade** - Testes isolados e seguros
3. **⚡ Agilidade** - Desenvolvimento paralelo eficiente
4. **🔄 Flexibilidade** - Merge quando cada módulo estiver pronto

### 🚀 **COMANDO PARA COMEÇAR:**
```bash
git checkout main
git checkout -b feature/usuarios-robusto
git push -u origin feature/usuarios-robusto
```

**Esta estratégia garante desenvolvimento seguro e organizado!** 🌿
