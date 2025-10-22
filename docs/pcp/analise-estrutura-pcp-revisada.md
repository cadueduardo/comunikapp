# 🔍 ANÁLISE E REVISÃO DA ESTRUTURA PCP

**Data:** 21/10/2025  
**Versão:** 2.0 (Revisada após análise da estrutura existente)

---

## ❓ **RESPOSTAS ÀS QUESTÕES**

### **1. Categoria vs Nome do Workflow**

**SUA PERGUNTA:**
> O nome do workflow já não seria como se fosse o nome da categoria?

**RESPOSTA:**
✅ **SIM!** Você está certo! Podemos **SIMPLIFICAR** e eliminar o conceito de "Categoria de Serviço".

#### **Estrutura Simplificada:**

```
ANTES (complexo demais):
Produto → Categoria de Serviço → Workflow → Setores

DEPOIS (mais simples):
Produto → Workflow → Setores
```

**Como funciona:**

```
Cadastro de Produto:

Produto: Banner 3x2m
├─ Nome: Banner 3x2m
├─ Tipo de Material: Lona
├─ Unidade: m²
└─ Workflow Padrão: [Produção Impressão Digital ▼]
                    ↑ Escolhe direto qual workflow

Produto: Display Acrílico
├─ Nome: Display Acrílico 30x40cm
├─ Tipo de Material: Acrílico
├─ Unidade: un
└─ Workflow Padrão: [Produção CNC Completa ▼]
```

**O nome do Workflow JÁ INDICA a categoria!**
- "Produção Impressão Digital" = Categoria de impressão
- "Produção CNC Completa" = Categoria de CNC
- "Produção Manual" = Categoria de trabalho manual

✅ **CONCLUSÃO:** Não precisa de tabela "Categoria de Serviço"! Use apenas o **Workflow**.

---

### **2. Onde Ficam as Configurações?**

**SUA PERGUNTA:**
> Configurações de workflow fica dentro de PCP hoje. Deveria estar em configurações?
> Cadastramento de setores não deveria estar em PCP?

**ANÁLISE DA ESTRUTURA EXISTENTE:**

```
Hoje:
  /pcp/workflows → CRUD de workflows
  /configuracoes → Máquinas, Funções, etc

Você está sugerindo:
  /configuracoes/setores-produtivos → CRUD de setores
  /pcp/setores → Operação (fila de trabalho)
```

**RESPOSTA:**

✅ **Sua sugestão faz MUITO sentido!** Vou propor uma organização melhor:

#### **Menu: CONFIGURAÇÕES** (Admin - Setup do Sistema)
```
Configurações
├─ Categorias de Insumos
├─ Fornecedores
├─ Tipos de Material
├─ Custos Indiretos
├─ Loja
│
├─ 🏭 PRODUÇÃO (novo grupo)
│  ├─ Setores Produtivos  ← NOVO
│  ├─ Máquinas e Equipamentos
│  ├─ Funções (Mão de Obra)
│  └─ Workflows  ← MOVE de /pcp para aqui
```

#### **Menu: PCP** (Operação Diária)
```
PCP
├─ 📊 Dashboard (overview)
├─ 📋 Kanban Gerencial (gestores)
├─ 🏭 Setores (operadores) ← NOVO
│  └─ Fila de trabalho por setor
├─ 📊 Apontamentos (já existe)
├─ 📈 Relatórios (já existe)
└─ ⚙️ Ir para Configurações → (link para /configuracoes/workflows)
```

**Lógica:**
- **Configurações** = SETUP (criar/editar estrutura)
- **PCP** = OPERAÇÃO (trabalhar no dia-a-dia)

✅ **CONCLUSÃO:** Workflows ficam em Configurações (setup), Fila de Setores fica em PCP (operação).

---

### **3. Aproveitamento de Máquinas e Funções**

**SUA SUGESTÃO:**
> Temos cadastro de máquinas e funções, talvez já podemos chamar dali estas partes de setores.

**ANÁLISE:**

Estrutura existente:
```typescript
maquina {
  id: string
  nome: "HP Latex 570"
  tipo: "Impressora"
  custo_hora: Decimal
  status: "ATIVA"
  capacidade: "30m²/dia"
}

funcao {
  id: string
  nome: "Operador de Impressora"
  custo_hora: Decimal
  maquina_id: string?  // Pode vincular função a máquina
}
```

**PROPOSTA REVISADA:**

#### **Setores = Agrupamento de Máquinas + Funções**

```typescript
SetorProdutivo {
  id: string
  nome: "Impressão Digital"
  codigo: "IMP-01"
  
  // VINCULA máquinas existentes
  maquinas_ids: ["maq_hp570", "maq_hp360"]
  
  // VINCULA funções existentes  
  funcoes_ids: ["func_operador_impressora", "func_aux_impressao"]
  
  // VINCULA usuários (operadores)
  operadores_ids: ["user_joao", "user_maria"]
  responsavel_id: "user_joao"
  
  // Visual/Organização
  cor: "#3B82F6"
  icone: "printer"
  ordem_kanban: 1
  
  // Outros campos...
}
```

**Benefícios:**
- ✅ **Reutiliza** cadastros existentes (máquinas, funções, usuários)
- ✅ **Não duplica** informações
- ✅ **Centraliza** gestão em um lugar
- ✅ Setor é apenas um **agrupador lógico**

**Exemplo Prático:**

```
Setor: "Impressão Digital"
├─ Máquinas:
│  ├─ HP Latex 570 (R$ 80/h)
│  └─ HP Latex 360 (R$ 60/h)
│
├─ Funções:
│  ├─ Operador de Impressora (R$ 25/h)
│  └─ Auxiliar de Impressão (R$ 18/h)
│
└─ Operadores:
   ├─ João Silva (Responsável)
   ├─ Maria Santos
   └─ Pedro Costa
```

✅ **CONCLUSÃO:** Setor é um conceito **NOVO** que **AGRUPA** máquinas, funções e usuários existentes!

---

## 🏗️ **ESTRUTURA REVISADA**

### **Hierarquia Simplificada:**

```
SETORES PRODUTIVOS
  └─ Agrupa: Máquinas + Funções + Operadores (existentes)
  
WORKFLOWS
  └─ Sequência de Setores
  
PRODUTOS
  └─ Workflow Padrão (direto, sem categoria intermediária)
  
ITENS DA OS
  └─ Herda Workflow do Produto
```

---

## 📁 **ORGANIZAÇÃO DE MENUS REVISADA**

### **CONFIGURAÇÕES** (`/configuracoes`)

```
Configurações Gerais
├─ Categorias de Insumos
├─ Fornecedores
├─ Tipos de Material
├─ Custos Indiretos
├─ Loja
└─ Validações Automáticas

🏭 PRODUÇÃO
├─ Setores Produtivos  ← NOVO (agrupa máq+func+users)
├─ Workflows           ← MOVE de /pcp/workflows
├─ Máquinas            ← JÁ EXISTE
└─ Funções             ← JÁ EXISTE
```

### **PCP** (`/pcp`)

```
Operação Diária
├─ Dashboard              ← JÁ EXISTE (melhorar)
├─ Kanban Gerencial       ← JÁ EXISTE (adaptar para setores)
├─ Meu Setor              ← NOVO (fila de trabalho)
├─ Apontamentos           ← JÁ EXISTE
├─ Etapas                 ← JÁ EXISTE  
└─ Relatórios             ← JÁ EXISTE
```

---

## 🔄 **ANÁLISE DO CÓDIGO EXISTENTE**

### **✅ O que JÁ funciona:**

1. **Workflows** (`/pcp/workflows`)
   - CRUD básico
   - Lista, cria, edita workflows
   - Armazena etapas em JSON
   
2. **Kanban** (`/pcp/kanban`)
   - Já busca OSs liberadas
   - Tem estatísticas
   - Componente `KanbanBoard` existe
   - Modo fullscreen

3. **Apontamentos** (`/pcp/apontamentos`)
   - Registro de atividades

4. **Backend PCP**
   - `WorkflowService`
   - `WorkflowTemplateController`
   - `os-pcp-integration.service`
   - Já faz integração OS ↔ PCP

### **🚧 O que precisa ADAPTAR:**

1. **Workflows**
   - ✅ Já existe a estrutura
   - ❌ Etapas são texto livre
   - 🔧 **Adaptar:** Vincular etapas a SETORES
   
2. **Kanban**
   - ✅ Já busca OSs
   - ❌ Colunas são fixas (por status da OS)
   - 🔧 **Adaptar:** Colunas dinâmicas (por setores cadastrados)
   - 🔧 **Adaptar:** Cards = PRODUTOS (não OS inteira)

3. **ItemOS**
   - ✅ Já tem status_liberacao_pcp
   - ❌ Não tem workflow_id
   - 🔧 **Adicionar:** Campos de workflow e setor atual

---

## 📊 **SCHEMA PRISMA - MUDANÇAS NECESSÁRIAS**

### **CRIAR:**

```prisma
// NOVO: Setor Produtivo (agrupador)
model SetorProdutivo {
  id                    String    @id @default(cuid())
  loja_id              String
  codigo               String    // IMP-01, CNC-01
  nome                 String    // Impressão Digital
  descricao            String?   @db.Text
  
  // Vinculações com cadastros existentes
  maquinas_ids         String?   @db.Text  // JSON array de IDs
  funcoes_ids          String?   @db.Text  // JSON array de IDs
  operadores_ids       String?   @db.Text  // JSON array user_ids
  responsavel_id       String?   // user_id do líder
  
  // Visual
  cor                  String    @default("#3B82F6")
  icone                String?   @default("building")
  ordem_kanban         Int       @default(0)
  
  // Config
  localizacao          String?
  permite_simultaneo   Boolean   @default(true)
  capacidade_max       Int?      @default(10)
  
  ativo                Boolean   @default(true)
  criado_em            DateTime  @default(now())
  atualizado_em        DateTime  @updatedAt
  
  loja                 loja      @relation(fields: [loja_id], references: [id])
  
  @@unique([loja_id, codigo])
  @@index([loja_id, ativo])
  @@map("setores_produtivos")
}
```

### **MODIFICAR:**

```prisma
// WorkflowOS - Adaptar etapas para vincular setores
model WorkflowOS {
  // ... campos existentes ...
  
  // etapas: JSON modificado
  // ANTES: [{ ordem: 1, nome: "Impressão" }]
  // DEPOIS: [{ ordem: 1, setor_id: "setor_123", tempo_estimado: 2 }]
}

// ItemOS - Adicionar controle de workflow
model ItemOS {
  // ... campos existentes ...
  
  // NOVOS CAMPOS
  workflow_id            String?    // Qual workflow este produto segue
  workflow_setor_atual   String?    // Em qual setor está agora
  workflow_etapa_ordem   Int?       // Ordem da etapa (1, 2, 3...)
  
  status_producao        String?    @default("AGUARDANDO")
  // AGUARDANDO | EM_ANDAMENTO | PAUSADO | CONCLUIDO
  
  operador_atual_id      String?    // Quem está trabalhando
  data_inicio_etapa      DateTime?  // Quando começou nesta etapa
  tempo_total_etapa      Int?       // Minutos gastos
  
  motivo_pausa           String?    @db.Text
  data_pausa             DateTime?
}

// ProdutoServico - Adicionar workflow padrão
model produto {
  // ... campos existentes ...
  
  // NOVO CAMPO
  workflow_padrao_id     String?    // Workflow que este produto usa
}
```

---

## 📁 **ORGANIZAÇÃO FINAL DE PASTAS**

### **Backend:**

```
backend/src/
├─ pcp/  (Módulo PCP - Operação)
│  ├─ controllers/
│  │  ├─ workflow.controller.ts           ← MOVE para /configuracoes
│  │  ├─ workflow-template.controller.ts  ← MOVE para /configuracoes
│  │  ├─ apontamento.controller.ts        ✅ FICA
│  │  ├─ etapa.controller.ts              ✅ FICA
│  │  ├─ notificacoes.controller.ts       ✅ FICA
│  │  └─ setor-fila.controller.ts         ← NOVO
│  │
│  └─ services/
│     ├─ workflow.service.ts              ← MOVE para /configuracoes
│     ├─ apontamento.service.ts           ✅ FICA
│     ├─ etapa.service.ts                 ✅ FICA
│     ├─ os-pcp-integration.service.ts    ✅ FICA
│     └─ setor-fila.service.ts            ← NOVO
│
├─ configuracoes/  (Módulo Configurações - Setup)
│  ├─ controllers/
│  │  ├─ setores-produtivos.controller.ts  ← NOVO
│  │  ├─ workflows.controller.ts           ← MOVE de /pcp
│  │  └─ ...existentes
│  │
│  └─ services/
│     ├─ setores-produtivos.service.ts     ← NOVO
│     ├─ workflows.service.ts              ← MOVE de /pcp
│     └─ ...existentes
```

### **Frontend:**

```
frontend/src/app/(main)/
├─ configuracoes/
│  ├─ categorias/           ✅ EXISTE
│  ├─ fornecedores/         ✅ EXISTE
│  ├─ maquinas/             ✅ EXISTE
│  ├─ funcoes/              ✅ EXISTE
│  ├─ setores-produtivos/   ← NOVO
│  └─ workflows/            ← MOVE de /pcp
│
├─ pcp/
│  ├─ page.tsx              ✅ EXISTE (dashboard)
│  ├─ kanban/               ✅ EXISTE (adaptar)
│  ├─ setores/              ← NOVO (fila de trabalho)
│  ├─ apontamentos/         ✅ EXISTE
│  ├─ etapas/               ✅ EXISTE
│  └─ relatorios/           ✅ EXISTE
```

✅ **CONCLUSÃO:**
- **Configurações** = Setup/Admin (Setores, Workflows, Máquinas, Funções)
- **PCP** = Operação (Dashboard, Kanban, Fila de Trabalho, Apontamentos)

---

## 🔗 **APROVEITAMENTO DE CADASTROS EXISTENTES**

### **Conceito: Setores como AGRUPADORES**

**Não criar campos duplicados!** Usar estruturas existentes:

```
SETOR PRODUTIVO = Agrupamento Lógico de:
├─ Máquinas (já cadastradas)
├─ Funções (já cadastradas)
└─ Usuários/Operadores (já cadastrados)
```

### **Exemplo Prático:**

#### **Cadastros Existentes:**

```
Máquinas:
├─ HP Latex 570 (Impressora)
├─ HP Latex 360 (Impressora)
└─ CNC Router 1325 (CNC)

Funções:
├─ Operador de Impressora (R$ 25/h)
├─ Operador de CNC (R$ 30/h)
└─ Auxiliar de Produção (R$ 18/h)

Usuários:
├─ João Silva (função: Operador de Impressora)
├─ Maria Santos (função: Operador de Impressora)
├─ Ana Paula (função: Operador de CNC)
└─ Pedro Costa (função: Auxiliar de Produção)
```

#### **Setores Criados (NOVO):**

```
Setor: Impressão Digital
├─ Máquinas: [HP Latex 570, HP Latex 360]  ← Referências
├─ Funções: [Operador de Impressora, Auxiliar]  ← Referências
├─ Operadores: [João, Maria, Pedro]  ← Referências
└─ Responsável: João Silva

Setor: CNC Laser
├─ Máquinas: [CNC Router 1325]
├─ Funções: [Operador de CNC]
├─ Operadores: [Ana Paula]
└─ Responsável: Ana Paula
```

**Vantagens:**
- ✅ Não duplica cadastros
- ✅ Se atualizar máquina/função, reflete no setor
- ✅ Setor é apenas "container lógico"
- ✅ Custos vêm dos cadastros originais
- ✅ Validações de permissão reaproveitam usuários

---

## 📋 **PLANO REVISADO - FASES**

### **FASE 1: Setores Produtivos** ⏱️ ~2 dias

```
1.1 Schema Prisma
  ├─ Criar model SetorProdutivo
  ├─ Adicionar campos em ItemOS (workflow_id, setor_atual, etc)
  ├─ Adicionar workflow_padrao_id em produto
  └─ Migration

1.2 Backend
  ├─ setores-produtivos.service.ts (em /configuracoes)
  ├─ setores-produtivos.controller.ts
  ├─ CRUD completo
  └─ Validar vínculos (máquinas, funções, users existem)

1.3 Frontend
  ├─ /configuracoes/setores-produtivos (CRUD)
  ├─ SetorForm: selecionar máquinas, funções, users de listas
  ├─ SetorList: visualizar todos setores
  └─ Integração API
```

### **FASE 2: Workflows Vinculados a Setores** ⏱️ ~1 dia

```
2.1 Backend
  ├─ Modificar WorkflowService para validar setores
  ├─ Adaptar etapas: { ordem, setor_id, tempo_estimado }
  └─ Migrar workflows existentes (se houver)

2.2 Frontend
  ├─ MOVER /pcp/workflows para /configuracoes/workflows
  ├─ Adaptar WorkflowForm:
  │  └─ Dropdown de setores (em vez de texto livre)
  └─ Mostrar nome do setor (não ID)
```

### **FASE 3: Vinculação Produto → Workflow** ⏱️ ~1 dia

```
3.1 Backend
  ├─ Adicionar campo workflow_padrao_id em produto
  ├─ Ao liberar para PCP, aplicar workflow do produto
  └─ Setar primeira etapa/setor

3.2 Frontend
  ├─ Adicionar campo Workflow em ProdutoForm
  ├─ Dropdown mostra workflows cadastrados
  ├─ Modificar PrazoProdutoComponent:
  │  ├─ Mostrar workflow que será aplicado
  │  ├─ Permitir alterar (casos especiais)
  │  └─ Ao confirmar, salvar workflow_id
```

### **FASE 4: Fila por Setor (Operadores)** ⏱️ ~3 dias

```
4.1 Backend - APIs
  ├─ GET /pcp/setores/:setor_id/fila
  ├─ POST /pcp/setores/:setor_id/iniciar (múltiplos)
  ├─ POST /pcp/setores/:setor_id/concluir (múltiplos)
  ├─ POST /pcp/setores/:setor_id/pausar (múltiplos + motivo)
  └─ POST /pcp/setores/:setor_id/retomar (múltiplos)

4.2 Frontend
  ├─ /pcp/setores
  ├─ Dropdown ou auto-detect de setor
  ├─ Seções: Aguardando, Em Andamento, Pausados
  ├─ Checkboxes para seleção múltipla
  ├─ Botões ação em lote
  └─ Timer de tempo em produção
```

### **FASE 5: Kanban Gerencial (Adaptar Existente)** ⏱️ ~2 dias

```
5.1 Backend
  ├─ Adaptar API kanban para retornar PRODUTOS
  ├─ Agrupar por setor_atual
  ├─ Métricas por setor

5.2 Frontend
  ├─ Adaptar /pcp/kanban existente
  ├─ Colunas dinâmicas (buscar setores do banco)
  ├─ Cards = produtos (não OS)
  ├─ Cores por workflow
  └─ Filtros: workflow, prioridade, atrasados
```

---

## 🎯 **DECISÕES FINAIS**

### ✅ **APROVADO:**

1. **Sem Categoria de Serviço** - Workflow já é a "categoria"
2. **Workflows em Configurações** - Setup do sistema
3. **Fila de Setores em PCP** - Operação diária
4. **Setores = Agrupadores** - Reutiliza máquinas/funções/users
5. **Granularidade = Produto** - Cada produto em um setor

### ❓ **AINDA DECIDIR:**

1. **Nomenclatura:**
   - "Setores Produtivos" ou "Centros de Trabalho"?
   - "Meu Setor" ou "Minha Fila"?

2. **Permissões:**
   - Sistema detecta setor do usuário (baseado em qual função/setor está vinculado)?
   - Ou usuário escolhe manualmente?

3. **Visualização Padrão:**
   - Dashboard PCP é a tela inicial?
   - Ou Operador vai direto para "Meu Setor"?

---

## 📊 **CRONOGRAMA ATUALIZADO**

| Fase | Descrição | Dias | Depende de |
|------|-----------|------|------------|
| 1 | Setores Produtivos (CRUD) | 2 | - |
| 2 | Workflows → Setores | 1 | Fase 1 |
| 3 | Produto → Workflow | 1 | Fase 2 |
| 4 | Fila por Setor | 3 | Fase 3 |
| 5 | Kanban Gerencial | 2 | Fase 4 |

**Total:** ~9 dias (reduzido de 11)

---

## ✅ **PRÓXIMOS PASSOS IMEDIATOS**

1. **Validar decisões pendentes** (nomenclaturas)
2. **Começar Fase 1:** Criar SetorProdutivo
   - Schema Prisma
   - Backend (service + controller)
   - Frontend (CRUD em /configuracoes)
3. **Testar** com dados reais da sua empresa

---

**Este documento substitui e melhora o plano anterior!**  
**Baseado em análise da estrutura real do sistema.**


