# ✅ DECISÕES FINALIZADAS - MÓDULO PCP

**Data:** 21/10/2025  
**Status:** ✅ Aprovado para Implementação

---

## 🎯 **TODAS AS DECISÕES TOMADAS**

### **1. NOMENCLATURAS**

| Conceito | Decisão | Observação |
|----------|---------|------------|
| Área Física | **Setores Produtivos** | Cadastrado em `/centros-de-trabalho/setores` |
| Tela Operador | **Meu Setor** | Dentro de `/pcp/setores` |
| Status Produto | **Seguir recomendação** | AGUARDANDO_LIBERACAO, AGUARDANDO_INICIO, EM_ANDAMENTO, PAUSADO, CONCLUIDO |

---

### **2. PERMISSÕES E ACESSO**

#### **Detecção de Setor:**
✅ **Seleção Manual (Opção B)**

```
Tela: /pcp/setores
Header: [Setor: Impressão Digital ▼]

Operador escolhe manualmente onde vai trabalhar.
Útil para empresas pequenas onde operador trabalha em várias funções.
```

#### **Tabela de Permissões:**

| Ação | Operador | Responsável Setor | Gestor PCP | Admin |
|------|----------|-------------------|------------|-------|
| Ver fila do setor | ✅ Qualquer setor | ✅ Seu setor | ✅ Todos | ✅ Todos |
| Iniciar produto | ✅ | ✅ | ❌ | ❌ |
| Pausar produto | ✅ Se iniciou | ✅ Qualquer | ✅ Qualquer | ✅ |
| Concluir produto | ✅ Se iniciou | ✅ Qualquer | ✅ Qualquer | ✅ |
| **Mover entre setores** | ❌ | ⚠️ Excepcional | ✅ | ✅ |
| Ver Kanban Geral | ❌ | ✅ | ✅ | ✅ |
| Editar Setores | ❌ | ❌ | ❌ | ✅ |
| Editar Workflows | ❌ | ❌ | ⚠️ Sugerir | ✅ |

---

### **⚠️ ESCLARECIMENTO: "Mover entre setores"**

**O que é:**
Ação EXCEPCIONAL para corrigir erros ou situações especiais.

#### **Cenário 1: Produto foi para setor errado**
```
Situação:
  Banner está no CNC (errado!)
  Deveria estar na Impressão

Ação do Gestor:
  1. Acessa produto
  2. [Mover para outro setor]
  3. Escolhe: Impressão Digital
  4. Motivo: "Produto foi para setor errado"
  5. Sistema move produto
```

#### **Cenário 2: Produto precisa pular uma etapa**
```
Situação:
  Display já vem pré-cortado do fornecedor
  Não precisa passar pelo CNC
  
Workflow Normal:
  Design → CNC → Montagem → Acabamento
  
Ação Excepcional do Gestor:
  1. Produto está em "Design" (concluído)
  2. [Mover para outro setor]
  3. Pula "CNC", vai direto para "Montagem"
  4. Motivo: "Material pré-cortado pelo fornecedor"
  5. Sistema registra exceção no log
```

#### **Cenário 3: Produto precisa voltar uma etapa**
```
Situação:
  Banner já estava no Acabamento
  Defeito encontrado na impressão
  Precisa reimprimir
  
Ação do Responsável:
  1. [Mover para outro setor]
  2. Volta para "Impressão Digital"
  3. Motivo: "Reimpressão - defeito na arte"
  4. Sistema registra retrabalho
```

**Implementação:**
```
Botão discreto (não destaque):
  [⚙️ Ações Especiais] →
    └─ Mover para outro setor (apenas Gestor/Admin)

Modal:
  Produto: Banner 3x2m
  Setor Atual: CNC Laser
  
  Mover para: [Impressão Digital ▼]
  Motivo: [___________________________]
  
  ⚠️ Esta é uma ação excepcional e será registrada no log.
  
  [Cancelar] [Confirmar Movimentação]
```

✅ **Fluxo normal:** Produto avança automaticamente ao clicar "Concluir"  
⚠️ **Fluxo excepcional:** Gestor pode mover manualmente (com justificativa)

---

### **3. ORGANIZAÇÃO DE MENUS**

#### **Centros de Trabalho** (Configurações de Produção)
```
/centros-de-trabalho/
├─ setores-produtivos  ← NOVO (cadastro de setores)
├─ maquinas            ← JÁ EXISTE
├─ funcoes             ← JÁ EXISTE
├─ servicos            ← JÁ EXISTE
└─ custos-indiretos    ← JÁ EXISTE
```

#### **PCP** (Operação)
```
/pcp/
├─ Dashboard
├─ Kanban Gerencial
├─ Meu Setor           ← NOVO
├─ Workflows           ← JÁ EXISTE (manter aqui por ora)
├─ Apontamentos
└─ Relatórios
```

**Observação:** 
- Setores em **Centros de Trabalho** (setup)
- Workflows ficam em **PCP** (por ora, pode mover depois se necessário)

---

### **4. EXPERIÊNCIA DO USUÁRIO**

#### **Menu Lateral:**
✅ "Meu Setor" aparece apenas dentro de `/pcp`

#### **Breadcrumb:**
❌ **NÃO implementar agora** (projeto futuro para todo sistema)

#### **Tela Inicial por Perfil:**
📋 **Projeto futuro** - Amadurecer módulo de Usuários/Perfis primeiro

#### **Navegação no PCP:**
```
Operador comum:
  /pcp → Dashboard → Clica "Meu Setor" → Escolhe setor no dropdown

Gestor:
  /pcp → Dashboard → Vê overview
  /pcp/kanban → Kanban Gerencial
```

---

### **5. VISUALIZAÇÕES**

#### **Kanban Gerencial:**
✅ **Layout A: Colunas Horizontais**
- Setores lado a lado
- Scroll horizontal se necessário

#### **Cards do Kanban:**
✅ **Compacto com Expandir**

```
Card Compacto:
┌─────────────────────┐
│ Banner 3x2m         │
│ OS #12345           │
│ 🟢 Ativo • João     │
│ ⏱️ 1h30             │
└─────────────────────┘

Card Expandido (ao clicar):
┌─────────────────────┐
│ Banner 3x2m         │
│ OS #12345           │
│ Cliente: Loja ABC   │
│ Prazo: 25/10        │
│ 🟢 Ativo            │
│ Operador: João      │
│ Iniciado: 10:30     │
│ Tempo: 1h30         │
│ [Ver OS] [Pausar]   │
└─────────────────────┘
```

---

### **6. REGRAS DE NEGÓCIO**

#### **Pausa de Produtos:**
✅ **Individual OU em Lote** (checkboxes)

#### **Avanço Automático:**
✅ **Sim, ao concluir avança automaticamente**

#### **Notificação Próximo Setor:**
✅ **SIM, com visual especial para novos**

```
Fila do Setor Acabamento:

🆕 NOVOS (chegaram agora):
┌─────────────────────┐ ← Borda azul ou fundo levemente destacado
│ Banner 3x2m         │
│ OS #12345           │
│ ✨ Chegou há 2 min  │
└─────────────────────┘

AGUARDANDO:
┌─────────────────────┐ ← Visual normal
│ Faixa 10m           │
│ OS #12346           │
│ Aguardando há 1h    │
└─────────────────────┘
```

**Implementação:**
- Produto ao chegar: flag `acabou_de_chegar = true`
- Após operador visualizar: flag vira `false`
- Visual destaca produtos novos

#### **Última Etapa:**
✅ **Produto CONCLUIDO + OS muda quando todos concluídos**

---

### **7. INTEGRAÇÕES**

#### **Estoque:**
✅ **SIM, mas implementar DEPOIS da Fase 1**

```
Ao iniciar produção:
  └─ Reservar materiais no estoque

Ao concluir produção:
  └─ Dar baixa automática no estoque
```

#### **Notificações:**
✅ **SIM, implementar DEPOIS**

```
Notificar quando:
  ├─ Produto chega no setor (operadores do setor)
  ├─ Produto parado há mais de X horas (gestor)
  ├─ Prazo vencendo (gestor + responsável OS)
  └─ Gargalo identificado (gestor)
```

#### **Validações:**
✅ **Já previsto em OS, implementar junto**

```
Antes de liberar produto para PCP:
  └─ Validar materiais disponíveis
  └─ Se falta material: bloquear liberação
  └─ Mostrar alerta de quais materiais faltam
```

---

### **8. DESIGN E UX**

#### **Cores dos Setores:**
✅ **Configurável no cadastro**

```
Ao criar/editar setor:

┌────────────────────────────────┐
│ Cor do Setor:                  │
│                                │
│ [Seletor de Cores]             │
│  🔵 🟣 🟢 🟠 🔴 🟡 ⚫ ⚪      │
│                                │
│ ⚠️ Cores já usadas:            │
│ • 🔵 Azul - Impressão Digital  │
│ • 🟣 Roxo - CNC Laser          │
│                                │
│ 💡 Sugestão: Use cores         │
│    diferentes para facilitar   │
│    identificação visual        │
└────────────────────────────────┘
```

**Validação:**
- Sistema avisa se cor já está sendo usada
- Permite usar mesma cor (não bloqueia)
- Mostra preview da cor escolhida

#### **Ícones dos Setores:**
❌ **NÃO usar ícones** (simplificar cadastro)

---

### **9. NUMERAÇÃO E RASTREAMENTO**

✅ **Usar apenas numeração existente** (DocumentCodeService)

```
Rastreamento no sistema:
  OS-2025-001
  └─ Produto 1: Banner
     └─ ID: cmgr0r7u6002dw4uwxop75m8u
        └─ Logs completos de movimentação
```

❌ **NÃO criar:** códigos adicionais para setores/workflows

---

## 📋 **ESTRUTURA FINAL APROVADA**

### **Organização de Pastas:**

```
/centros-de-trabalho/
├─ page.tsx (dashboard centros)
├─ setores/              ← NOVO
│  ├─ page.tsx (lista)
│  ├─ novo/
│  │  └─ page.tsx
│  └─ editar/[id]/
│     └─ page.tsx
├─ maquinas/             ✅ EXISTE
├─ funcoes/              ✅ EXISTE
├─ servicos/             ✅ EXISTE
└─ custos-indiretos/     ✅ EXISTE

/pcp/
├─ page.tsx              ✅ Dashboard
├─ kanban/               ✅ Adaptar
├─ setores/              ← NOVO (Meu Setor)
│  └─ page.tsx
├─ workflows/            ✅ EXISTE
├─ apontamentos/         ✅ EXISTE
├─ etapas/               ✅ EXISTE
└─ relatorios/           ✅ EXISTE
```

---

### **Schema Prisma - Campos Definidos:**

```prisma
SetorProdutivo {
  id                    String    @id @default(cuid())
  loja_id              String
  codigo               String    // IMP-01, CNC-01
  nome                 String    // Impressão Digital
  descricao            String?   @db.Text
  
  // Vinculações (referências)
  maquinas_ids         String?   @db.Text  // JSON array
  funcoes_ids          String?   @db.Text  // JSON array
  operadores_ids       String?   @db.Text  // JSON array
  responsavel_id       String?
  
  // Visual
  cor                  String    @default("#3B82F6")
  // SEM campo icone (simplificado)
  ordem_kanban         Int       @default(0)
  
  // Outros campos...
  ativo                Boolean   @default(true)
  
  @@map("setores_produtivos")
}

ItemOS {
  // Campos existentes...
  
  // NOVOS CAMPOS
  workflow_id            String?
  workflow_setor_atual   String?    // ID do setor
  workflow_etapa_ordem   Int?
  
  status_producao        String?    @default("AGUARDANDO_LIBERACAO")
  // AGUARDANDO_LIBERACAO | AGUARDANDO_INICIO | EM_ANDAMENTO | PAUSADO | CONCLUIDO
  
  operador_atual_id      String?
  data_inicio_etapa      DateTime?
  
  motivo_pausa           String?    @db.Text
  acabou_de_chegar       Boolean    @default(false)  // Flag para destacar novos
}

produto {
  // Campos existentes...
  
  workflow_padrao_id     String?  // Workflow que este produto usa
}
```

---

## 🔄 **FLUXOS APROVADOS**

### **Fluxo 1: Pausa de Produtos**

```
Tela: Meu Setor > Em Andamento

☐ Banner 1
☑ Banner 2  ← Selecionado
☑ Banner 3  ← Selecionado
☐ Banner 4

[Pausar Selecionados] ou [Pausar Todos]

Modal:
  Motivo: [Falta material ▼]
          • Falta material
          • Problema técnico
          • Aguardando aprovação
          • Outro: ___
  
  [Confirmar]

Sistema:
  ├─ status_producao = "PAUSADO"
  ├─ motivo_pausa = "Falta material"
  ├─ data_pausa = agora
  └─ Move para seção "Pausados"
```

---

### **Fluxo 2: Avanço Automático**

```
Operador clica [Concluir] no produto

Sistema:
  1. Busca workflow do produto
  2. Etapa atual: Impressão (ordem 1)
  3. Próxima etapa: Acabamento (ordem 2)
  4. Atualiza produto:
     ├─ workflow_etapa_ordem = 2
     ├─ workflow_setor_atual = setor_acabamento
     ├─ status_producao = "AGUARDANDO_INICIO"
     ├─ operador_atual_id = null
     └─ acabou_de_chegar = true ← Flag para destacar
  5. Produto aparece na fila do Acabamento
  6. Sistema notifica operadores do Acabamento
  7. Visual destaca produto novo (borda/fundo diferente)
```

---

### **Fluxo 3: Última Etapa**

```
Operador do setor Expedição clica [Concluir]

Sistema verifica:
  ├─ É a última etapa do workflow? SIM
  └─ Atualiza produto:
     ├─ status_producao = "CONCLUIDO"
     ├─ data_conclusao = agora
     └─ Produto sai do Kanban

  ├─ Verifica OS:
  │  ├─ Todos produtos da OS concluídos? SIM
  │  └─ OS.status = "CONCLUIDA"
  │
  └─ Ainda tem produtos pendentes? NÃO
     └─ OS continua "EM_WORKFLOW"
```

---

### **Fluxo 4: Movimentação Excepcional**

```
Gestor/Admin acessa produto no Kanban

[⚙️ Ações] →
  └─ Mover para outro setor

Modal:
  Produto: Banner 3x2m
  Setor Atual: CNC Laser (Etapa 2/3)
  
  Mover para: [Impressão Digital ▼]
              • Impressão Digital (Etapa 1)
              • Acabamento (Etapa 3)
              • Expedição (Etapa 4)
  
  Motivo Obrigatório: [_________________________]
  
  ⚠️ ATENÇÃO: Esta ação é excepcional
     Será registrada no histórico da OS
  
  [Cancelar] [Confirmar]

Sistema:
  ├─ Registra no log:
  │  └─ "Movimentação manual: CNC → Impressão"
  │  └─ "Usuário: João (Gestor)"
  │  └─ "Motivo: [motivo informado]"
  │
  ├─ Atualiza produto:
  │  ├─ workflow_setor_atual = setor escolhido
  │  ├─ status_producao = "AGUARDANDO_INICIO"
  │  └─ acabou_de_chegar = true
  │
  └─ Produto aparece na nova fila
```

---

## 🎨 **DESIGN APROVADO**

### **Cores:**
✅ **Configurável + Validação**

```
Paleta sugerida (mas não obrigatória):
├─ 🔵 #3B82F6 - Azul
├─ 🟣 #8B5CF6 - Roxo
├─ 🟢 #10B981 - Verde
├─ 🟠 #F97316 - Laranja
├─ 🔴 #EF4444 - Vermelho
├─ 🟡 #EAB308 - Amarelo
├─ ⚫ #1F2937 - Cinza Escuro
└─ 🟤 #92400E - Marrom
```

**No cadastro:**
- Seletor visual de cores
- Aviso de cores já usadas
- Permite duplicar (não bloqueia)

### **Ícones:**
❌ **NÃO usar** (simplificado)

### **Visual de Novos Produtos:**
✅ **Borda/Fundo destacado**

```
CSS:
  .produto-novo {
    border-left: 4px solid #3B82F6;
    background: #EFF6FF;
  }
  
  .produto-normal {
    border-left: 1px solid #E5E7EB;
  }
```

---

## 📱 **INTEGRAÇÕES - CRONOGRAMA**

| Integração | Fase | Prioridade |
|------------|------|------------|
| Estoque (reserva/baixa) | Fase 6 | Média |
| Notificações real-time | Fase 5 | Alta |
| Validações material | Com OS | Alta |
| Relatórios | Fase 7 | Baixa |

**Fase 1-4:** Foco no fluxo básico (sem integrações complexas)

---

## 📅 **CRONOGRAMA AJUSTADO**

| Fase | Descrição | Dias | Observação |
|------|-----------|------|------------|
| 1 | Setores Produtivos | 2 | Em /centros-de-trabalho |
| 2 | Workflows → Setores | 1 | Adaptar existente |
| 3 | Produto → Workflow | 1 | Campo no cadastro |
| 4 | Meu Setor (Fila) | 3 | Operação diária |
| 5 | Kanban + Notificações | 2 | Adaptar existente |
| 6 | Integração Estoque | 2 | Reserva/Baixa |
| 7 | Relatórios | 1 | Métricas |

**Total:** ~12 dias

---

## ✅ **CHECKLIST FINAL - TUDO DECIDIDO**

- ✅ Nomenclatura: "Setores Produtivos" 
- ✅ Local: Dentro de "Centros de Trabalho"
- ✅ Tela Operador: "Meu Setor" em /pcp
- ✅ Detecção: Seleção Manual (dropdown)
- ✅ Permissões: Tabela validada
- ✅ "Mover entre setores": Casos excepcionais (gestor/admin)
- ✅ Kanban: Colunas horizontais
- ✅ Cards: Compactos com expandir
- ✅ Pausa: Individual ou lote
- ✅ Notificação: Sim, visual destaca novos
- ✅ Cores: Configurável com validação
- ✅ Ícones: Não usar
- ✅ Integrações: Fase 6 (depois do básico)
- ✅ Breadcrumb: Projeto futuro (não agora)

---

## 🚀 **PRÓXIMO PASSO**

✅ **Todas decisões tomadas!**  
✅ **Plano validado!**  
✅ **Pronto para começar implementação!**

**Iniciar com:**
1. Criar branch `feature/pcp-setores-produtivos`
2. Schema Prisma (SetorProdutivo)
3. Backend: Service + Controller
4. Frontend: CRUD em /centros-de-trabalho/setores

**Aguardando comando para começar!** 🎯


