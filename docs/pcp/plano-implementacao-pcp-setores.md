# 🏭 PLANO DE IMPLEMENTAÇÃO - PCP POR SETORES PRODUTIVOS

**Data de Criação:** 21/10/2025  
**Status:** 📋 Planejamento  
**Versão:** 1.0

---

## 📊 **RESUMO EXECUTIVO**

Sistema de PCP (Planejamento e Controle de Produção) baseado em **Setores Produtivos**, onde cada produto passa por uma sequência de setores definida em seu Workflow, permitindo:

- ✅ Múltiplos workflows na mesma OS (produtos diferentes)
- ✅ Produtos em setores diferentes simultaneamente
- ✅ Operação em lote (múltiplos produtos juntos)
- ✅ Pausas individuais e em lote
- ✅ Visão por setor (operadores) e geral (gestores)

---

## 🎯 **CONCEITOS PRINCIPAIS**

### **1. SETOR PRODUTIVO**
Área física da empresa onde o trabalho acontece.

**Exemplos:**
- Impressão Digital
- CNC Laser
- Acabamento
- Expedição
- Design/Preparação
- Montagem

**Características:**
- Tem responsável e operadores autorizados
- Tem equipamentos e capacidade
- Tem fila de trabalho própria
- Identificado por cor no sistema

### **2. WORKFLOW**
Sequência de SETORES que um produto passa até ficar pronto.

**Exemplos:**

**Workflow: "Produção Impressão Digital"**
1. Impressão Digital → 2h
2. Acabamento → 1h
3. Expedição → 30min

**Workflow: "PDV Acrílico CNC"**
1. Design/Preparação → 1h
2. CNC Laser → 4h
3. Colagem/Montagem → 3h
4. Acabamento → 1h
5. Expedição → 30min

### **3. CATEGORIA DE SERVIÇO**
Agrupamento de produtos por tipo de processo produtivo.

**Exemplos:**
- Impressão Digital (Banner, Lona, Adesivo)
- Acrílicos e CNC (Displays, Placas)
- Sinalização Externa (Totens, Fachadas)

**Função:**
- Simplifica vinculação produto → workflow
- Produto herda workflow da categoria
- Permite automação

### **4. GRANULARIDADE: PRODUTO**
Cada PRODUTO da OS tem seu próprio:
- Workflow
- Setor atual
- Status de produção
- Operador trabalhando

**Exemplo:**
```
OS #12345 - Cliente ABC
├─ Produto 1: Banner 3x2m
│  ├─ Categoria: Impressão Digital
│  ├─ Workflow: Produção Impressão Padrão
│  └─ Setor Atual: Impressão (Etapa 1/3)
│
└─ Produto 2: Display Acrílico
   ├─ Categoria: Acrílicos e CNC
   ├─ Workflow: PDV Acrílico CNC
   └─ Setor Atual: CNC Laser (Etapa 2/5)
```

---

## 🏗️ **ARQUITETURA DE DADOS**

### **Novas Tabelas Prisma:**

```prisma
// 1. Setores Produtivos
model SetorProdutivo {
  id                    String    @id @default(cuid())
  loja_id              String
  codigo               String    // IMP-01, CNC-01, etc
  nome                 String    // Impressão Digital
  descricao            String?   @db.Text
  
  // Visual
  cor_identificacao    String    @default("#3B82F6")
  icone                String?   // Tabler icon name
  ordem_kanban         Int       @default(0)
  
  // Localização
  localizacao          String?
  andar                String?
  
  // Equipamentos (JSON)
  equipamentos         String?   @db.Text
  
  // Gestão
  responsavel_id       String?
  operadores_ids       String?   @db.Text  // JSON array
  
  // Configurações
  permite_simultaneo   Boolean   @default(true)
  capacidade_maxima    Int?      @default(10)
  
  ativo                Boolean   @default(true)
  criado_em            DateTime  @default(now())
  atualizado_em        DateTime  @updatedAt
  
  loja                 loja      @relation(fields: [loja_id], references: [id])
  
  @@unique([loja_id, codigo])
  @@index([loja_id, ativo])
  @@map("setores_produtivos")
}

// 2. Categoria de Serviço
model CategoriaServico {
  id                    String    @id @default(cuid())
  loja_id              String
  nome                 String
  descricao            String?   @db.Text
  
  workflow_padrao_id   String?
  
  cor_identificacao    String    @default("#6B7280")
  icone                String?
  ativo                Boolean   @default(true)
  
  criado_em            DateTime  @default(now())
  atualizado_em        DateTime  @updatedAt
  
  loja                 loja      @relation(fields: [loja_id], references: [id])
  workflow_padrao      WorkflowOS? @relation(fields: [workflow_padrao_id], references: [id])
  
  @@unique([loja_id, nome])
  @@index([loja_id, ativo])
  @@map("categorias_servico")
}
```

### **Modificações em Tabelas Existentes:**

```prisma
// WorkflowOS - Adicionar vínculo com setores
model WorkflowOS {
  // ... campos existentes ...
  
  categoria_servico_id String?  // Opcional: workflow vinculado a categoria
  
  // etapas agora vincula setores:
  // etapas: JSON com estrutura:
  // [
  //   { ordem: 1, setor_id: "setor_123", tempo_estimado_horas: 2 },
  //   { ordem: 2, setor_id: "setor_456", tempo_estimado_horas: 1 }
  // ]
}

// ItemOS - Adicionar controle de workflow e setor
model ItemOS {
  // ... campos existentes ...
  
  // NOVOS CAMPOS
  categoria_servico_id   String?    // Categoria do produto
  workflow_id            String?    // Qual workflow está usando
  workflow_setor_atual   String?    // ID do setor atual
  workflow_etapa_ordem   Int?       // Ordem da etapa (1, 2, 3...)
  
  status_producao        String?    @default("AGUARDANDO")
  // AGUARDANDO | EM_ANDAMENTO | PAUSADO | CONCLUIDO
  
  operador_atual_id      String?    // Quem está trabalhando
  data_inicio_etapa      DateTime?  // Quando iniciou nesta etapa
  
  motivo_pausa           String?    @db.Text  // Se pausado, por quê
}

// ProdutoServico - Adicionar categoria
model ProdutoServico {
  // ... campos existentes ...
  
  categoria_servico_id   String?  // Categoria do produto
}
```

---

## 🔄 **FLUXO COMPLETO DO SISTEMA**

### **FASE 1: Configuração Inicial (Admin)**

#### **1.1 Cadastrar Setores Produtivos**
```
Configurações → Setores Produtivos → Novo

✅ Impressão Digital
   • Código: IMP-01
   • Responsável: João Silva
   • Operadores: João, Maria, Pedro
   • Cor: 🔵 Azul

✅ CNC Laser
   • Código: CNC-01
   • Responsável: Ana Paula
   • Cor: 🟣 Roxo

✅ Acabamento
   • Código: ACAB-01
   • Responsável: Roberto
   • Cor: 🟢 Verde

✅ Expedição
   • Código: EXP-01
   • Responsável: Marcos
   • Cor: 🟠 Laranja
```

#### **1.2 Criar Workflows (vinculando setores)**
```
Configurações → Workflows → Novo

Workflow: "Produção Impressão Digital"
  Etapas:
  1. [Setor: Impressão Digital ▼] - 2h
  2. [Setor: Acabamento ▼] - 1h
  3. [Setor: Expedição ▼] - 30min

Workflow: "Produção CNC Completa"
  Etapas:
  1. [Setor: Design ▼] - 1h
  2. [Setor: CNC Laser ▼] - 4h
  3. [Setor: Montagem ▼] - 3h
  4. [Setor: Acabamento ▼] - 1h
  5. [Setor: Expedição ▼] - 30min
```

#### **1.3 Criar Categorias de Serviço (Opcional mas Recomendado)**
```
Configurações → Categorias de Serviço → Nova

Categoria: "Impressão Digital"
  • Workflow Padrão: Produção Impressão Digital
  • Cor: 🔵 Azul

Categoria: "Acrílicos e CNC"
  • Workflow Padrão: Produção CNC Completa
  • Cor: 🟣 Roxo
```

#### **1.4 Vincular Produtos a Categorias**
```
Produtos → Banner 3x2m → Editar
  • Categoria: Impressão Digital
  • (Herda workflow automaticamente)

Produtos → Display Acrílico → Editar
  • Categoria: Acrílicos e CNC
  • (Herda workflow automaticamente)
```

---

### **FASE 2: Operação Diária**

#### **2.1 Vendedor cria Orçamento/OS**
```
Orçamento → Adiciona produtos
  • Banner 3x2m (Categoria: Impressão Digital)
  • Display Acrílico (Categoria: Acrílicos CNC)

Sistema detecta automaticamente workflows necessários
```

#### **2.2 OS Aprovada → Definir Prazos**
```
OS → Aba "Resumo" → Produtos

Produto: Banner 3x2m
  [Definir Prazo] →
    Data: 25/10/2024
    Workflow: [Produção Impressão Digital ✓] ← Auto-preenchido
    [Confirmar e Liberar para PCP]

Sistema:
  • ItemOS.workflow_id = workflow_impressao
  • ItemOS.workflow_setor_atual = "Impressão Digital"
  • ItemOS.workflow_etapa_ordem = 1
  • ItemOS.status_producao = "AGUARDANDO"
  • Produto vai para fila do setor Impressão
```

#### **2.3 Operador do Setor (Impressão)**
```
Tela: /pcp/setores/impressao

Fila (5 produtos):
  ☐ Banner 3x2m - OS #12345 [Iniciar]
  ☐ Faixa 10m - OS #12346 [Iniciar]
  ...

[Iniciar Selecionados] (múltiplos)

Operador:
1. Seleciona múltiplos produtos
2. Clica "Iniciar"
3. Produtos vão para "Em Andamento"
4. Trabalha...
5. Clica "Concluir"
6. Produtos vão para próximo setor (Acabamento)
```

#### **2.4 Gestor Acompanha**
```
Tela: /pcp/kanban

Visualização Overview:
  Impressão (5) | CNC (2) | Acabamento (8) | Expedição (3)
  
Identifica:
  • Gargalo em Acabamento (8 produtos)
  • OS pausada há 3h (falta material)
  • Produtos atrasados
```

---

## 📱 **TELAS DO SISTEMA**

### **1. Tela: Dashboard PCP** (`/pcp`)
**Público:** Todos  
**Função:** Overview geral

```
Cards de Resumo:
  • OSs Liberadas: X
  • Workflows Ativos: Y
  • Em Produção Hoje: Z
  • Concluídas Hoje: W

OSs Liberadas para PCP (sem workflow)
Workflows Ativos (OSs em produção)
Ações Rápidas
```

### **2. Tela: Kanban Gerencial** (`/pcp/kanban`)
**Público:** Gestores  
**Função:** Overview visual de todos setores

```
Filtros:
  • Por Categoria
  • Por Prioridade
  • Por Data/Prazo
  • Por Status (Atrasado, Normal)

Colunas Dinâmicas (setores cadastrados):
  [Impressão] [CNC] [Acabamento] [Expedição]
  
Cards em cada coluna:
  • Produto
  • OS
  • Tempo no setor
  • Operador
  • Status
```

### **3. Tela: Fila por Setor** (`/pcp/setores`)
**Público:** Operadores  
**Função:** Gerenciar fila do setor

```
Header:
  Setor: [Impressão Digital ▼]  ← Dropdown ou auto-detectado
  Operador: João Silva

Seções:
  📋 Fila (produtos aguardando)
     • Checkbox para selecionar múltiplos
     • [Iniciar Selecionados]
  
  ⚡ Em Andamento (produtos sendo produzidos)
     • Timer de quanto tempo está rodando
     • [Concluir] [Pausar]
     • [Concluir Todos] [Pausar Todos]
  
  ⏸️ Pausados (produtos com problema)
     • Motivo da pausa
     • [Retomar]
```

### **4. Tela: Setores Produtivos** (`/configuracoes/setores`)
**Público:** Admin  
**Função:** CRUD de setores

```
Lista de Setores:
  • Nome, Código, Responsável
  • Status (Ativo/Inativo)
  • [Novo Setor] [Editar] [Desativar]
```

### **5. Tela: Workflows** (`/pcp/workflows`)
**Público:** Admin  
**Função:** CRUD de workflows (modificada)

```
Criar/Editar Workflow:
  Nome: [___]
  Tipo: [Sequencial ▼]
  
  Etapas:
    1. [Setor: Impressão Digital ▼] - 2h
    2. [Setor: Acabamento ▼] - 1h
    3. [Setor: Expedição ▼] - 30min
    
    [+ Adicionar Etapa]
```

### **6. Tela: Categorias de Serviço** (`/configuracoes/categorias-servico`)
**Público:** Admin  
**Função:** CRUD de categorias

```
Lista de Categorias:
  • Nome
  • Workflow Padrão
  • Produtos vinculados
  • [Nova Categoria] [Editar]
```

---

## 🚀 **FASES DE IMPLEMENTAÇÃO**

### **FASE 1: Infraestrutura de Setores** ⏱️ ~2 dias

#### **1.1 Schema Prisma**
- [ ] Criar model `SetorProdutivo`
- [ ] Criar model `CategoriaServico`
- [ ] Adicionar campos em `ItemOS` (workflow_id, setor_atual, etc)
- [ ] Adicionar campo em `ProdutoServico` (categoria_servico_id)
- [ ] Modificar `WorkflowOS.etapas` para vincular setores
- [ ] Criar migration

#### **1.2 Backend - Setores Produtivos**
- [ ] Service: `setores-produtivos.service.ts`
- [ ] Controller: `setores-produtivos.controller.ts`
- [ ] DTOs: create, update, response
- [ ] Endpoints CRUD: GET, POST, PUT, DELETE

#### **1.3 Backend - Categorias de Serviço**
- [ ] Service: `categorias-servico.service.ts`
- [ ] Controller: `categorias-servico.controller.ts`
- [ ] DTOs: create, update, response
- [ ] Endpoints CRUD

#### **1.4 Frontend - CRUD Setores**
- [ ] Página: `/configuracoes/setores-produtivos`
- [ ] Componentes: SetorForm, SetorList, SetorCard
- [ ] Integração API

#### **1.5 Frontend - CRUD Categorias**
- [ ] Página: `/configuracoes/categorias-servico`
- [ ] Componentes: CategoriaForm, CategoriaList
- [ ] Integração API

---

### **FASE 2: Vinculação Produto → Workflow** ⏱️ ~1 dia

#### **2.1 Modificar Cadastro de Produtos**
- [ ] Adicionar campo "Categoria de Serviço"
- [ ] Mostrar workflow herdado
- [ ] Permitir sobrescrever workflow (casos especiais)

#### **2.2 Modificar Criação de Workflows**
- [ ] Trocar "etapas livres" por "seleção de setores"
- [ ] Dropdown mostra setores cadastrados
- [ ] Validar que setores existem

#### **2.3 Modificar Tela de Definir Prazo**
- [ ] Componente `PrazoProdutoComponent.tsx`
- [ ] Mostrar workflow que será aplicado
- [ ] Permitir alterar workflow (link discreto)
- [ ] Ao confirmar, salvar workflow_id no ItemOS

#### **2.4 Backend - Aplicar Workflow Automaticamente**
- [ ] Ao liberar produto para PCP, aplicar workflow
- [ ] Setar primeira etapa/setor automaticamente
- [ ] Validar que workflow existe e está ativo

---

### **FASE 3: Tela por Setor (Operadores)** ⏱️ ~3 dias

#### **3.1 Backend - API de Fila por Setor**
- [ ] Endpoint: `GET /pcp/setores/:setor_id/fila`
- [ ] Retornar produtos AGUARDANDO neste setor
- [ ] Retornar produtos EM_ANDAMENTO neste setor
- [ ] Retornar produtos PAUSADOS neste setor

#### **3.2 Backend - Ações do Setor**
- [ ] Endpoint: `POST /pcp/setores/:setor_id/iniciar`
  - Recebe: lista de item_ids
  - Atualiza: status_producao = EM_ANDAMENTO
  - Registra: operador_atual, data_inicio_etapa
  
- [ ] Endpoint: `POST /pcp/setores/:setor_id/concluir`
  - Recebe: lista de item_ids
  - Avança: workflow_etapa_ordem++
  - Atualiza: workflow_setor_atual = próximo setor
  - Status: AGUARDANDO (no próximo setor)
  - Registra: histórico de movimentação
  
- [ ] Endpoint: `POST /pcp/setores/:setor_id/pausar`
  - Recebe: lista de item_ids + motivo
  - Atualiza: status_producao = PAUSADO
  - Salva: motivo_pausa

- [ ] Endpoint: `POST /pcp/setores/:setor_id/retomar`
  - Recebe: lista de item_ids
  - Atualiza: status_producao = EM_ANDAMENTO

#### **3.3 Frontend - Tela do Setor**
- [ ] Página: `/pcp/setores`
- [ ] Componente: `SetorFilaComponent`
- [ ] Seções: Aguardando, Em Andamento, Pausados
- [ ] Seleção múltipla (checkboxes)
- [ ] Botões: Iniciar, Pausar, Concluir (individual e lote)
- [ ] Timer de quanto tempo em produção
- [ ] Detecção automática do setor do usuário

#### **3.4 Frontend - Modal de Pausa**
- [ ] Campo: Motivo da pausa
- [ ] Sugestões: Falta material, Problema técnico, etc
- [ ] Aplicar em múltiplos produtos

---

### **FASE 4: Kanban Gerencial** ⏱️ ~3 dias

#### **4.1 Backend - API Kanban**
- [ ] Endpoint: `GET /pcp/kanban`
- [ ] Retornar todos produtos em produção
- [ ] Agrupar por setor atual
- [ ] Incluir métricas: tempo médio, gargalos

#### **4.2 Backend - Métricas**
- [ ] Calcular tempo médio por setor
- [ ] Identificar gargalos (muitos produtos aguardando)
- [ ] Alertas de produtos parados há muito tempo
- [ ] Produtos atrasados (prazo vencendo)

#### **4.3 Frontend - Kanban Visual**
- [ ] Página: `/pcp/kanban`
- [ ] Colunas dinâmicas (baseadas nos setores cadastrados)
- [ ] Cards de produtos em cada coluna
- [ ] Filtros: Categoria, Prioridade, Atrasados
- [ ] Cores por categoria
- [ ] Métricas no topo de cada coluna

#### **4.4 Frontend - Cards do Kanban**
- [ ] Componente: `KanbanCard`
- [ ] Mostra: Produto, OS, Cliente, Operador, Tempo
- [ ] Status visual: Ativo, Aguardando, Pausado
- [ ] Click abre detalhes
- [ ] Cor de borda = categoria

---

### **FASE 5: Melhorias e Automações** ⏱️ ~2 dias

#### **5.1 Notificações**
- [ ] Notificar setor quando produto chega na fila
- [ ] Alertar produtos parados há muito tempo
- [ ] Alertar prazos vencendo

#### **5.2 Relatórios**
- [ ] Produtividade por setor
- [ ] Tempo médio por workflow
- [ ] Gargalos históricos
- [ ] Performance de operadores

#### **5.3 Regras Automáticas**
- [ ] Auto-pausar se falta material (integração estoque)
- [ ] Sugerir realocação de produtos (gargalos)
- [ ] Priorização automática (prazo urgente)

---

## 🎨 **ESTRUTURA DE NAVEGAÇÃO**

```
Menu: PCP
├─ 📊 Dashboard
│  └─ /pcp
│
├─ 📋 Kanban Gerencial
│  └─ /pcp/kanban
│
├─ 🏭 Meu Setor
│  └─ /pcp/setores
│     └─ Auto-detecta ou dropdown
│
├─ 🔄 Workflows
│  └─ /pcp/workflows
│     ├─ Lista
│     ├─ Novo
│     └─ Editar
│
├─ ⚙️ Configurações
│  ├─ /configuracoes/setores-produtivos
│  └─ /configuracoes/categorias-servico
│
└─ 📈 Relatórios
   └─ /pcp/relatorios
```

---

## 🎯 **REGRAS DE NEGÓCIO**

### **Movimentação de Produtos:**

1. **Iniciar Produção:**
   - Produto precisa estar AGUARDANDO
   - Operador precisa ter permissão no setor
   - Atualiza status, operador, timestamp

2. **Concluir Etapa:**
   - Produto precisa estar EM_ANDAMENTO
   - Avança para próximo setor do workflow
   - Se última etapa → status_producao = CONCLUIDO
   - Se última etapa → OS.status pode virar CONCLUIDA (se todos produtos concluídos)

3. **Pausar:**
   - Pode pausar individual ou múltiplos
   - Motivo é obrigatório
   - Produto fica na seção "Pausados"

4. **Retomar:**
   - Volta para EM_ANDAMENTO
   - Continua de onde parou

### **Operações em Lote:**

```
Cenário: Operador vai imprimir 5 banners juntos

1. Seleciona 5 produtos na fila
2. Clica [Iniciar Selecionados]
3. Todos vão para "Em Andamento"
4. Impressora roda...
5. Problema: acabou material
6. Seleciona os 5
7. Clica [Pausar Todos]
8. Modal: "Motivo: Falta material - Lona branca"
9. Todos pausados
10. Material chega
11. [Retomar Todos]
```

---

## 📊 **MÉTRICAS E KPIs**

### **Por Setor:**
- Produtos na fila
- Produtos em andamento
- Produtos pausados
- Tempo médio de execução
- Taxa de utilização (% do tempo ativo)
- Gargalos (fila crescente)

### **Geral:**
- Lead time médio (tempo total do workflow)
- Throughput (produtos/dia)
- WIP (Work in Progress - produtos em produção)
- Taxa de conclusão no prazo
- Setores críticos

---

## 🔧 **TECNOLOGIAS**

### **Backend:**
- NestJS
- Prisma ORM
- PostgreSQL
- WebSockets (notificações real-time)

### **Frontend:**
- Next.js 14
- React
- TailwindCSS
- Shadcn/UI
- React DnD (drag-and-drop no Kanban - opcional)

---

## 📝 **PRÓXIMOS PASSOS IMEDIATOS**

1. **Validar este plano** com equipe/stakeholders
2. **Decidir nomenclaturas finais**
3. **Começar Fase 1**: Cadastro de Setores Produtivos
4. **Testar com dados reais** da empresa
5. **Ajustar baseado no feedback**

---

## ❓ **DECISÕES PENDENTES**

### **Nomenclatura:**
- [ ] "Setores Produtivos" ou "Departamentos"?
- [ ] "Categoria de Serviço" ou "Linha de Produção"?
- [ ] "Fila do Setor" ou "Minha Área de Trabalho"?

### **Permissões:**
- [ ] Sistema detecta setor do operador automaticamente?
- [ ] Ou operador escolhe setor manualmente?
- [ ] Operador pode ver/trabalhar em múltiplos setores?

### **Vinculação Produto → Workflow:**
- [ ] Usar Categorias (mais automático)
- [ ] Direto no Produto (mais manual)
- [ ] Ambos (categoria padrão + override)

---

## 📅 **CRONOGRAMA ESTIMADO**

| Fase | Descrição | Tempo | Prioridade |
|------|-----------|-------|------------|
| 1 | Infraestrutura de Setores | 2 dias | 🔴 Alta |
| 2 | Vinculação Produto → Workflow | 1 dia | 🔴 Alta |
| 3 | Tela por Setor (Operadores) | 3 dias | 🟡 Média |
| 4 | Kanban Gerencial | 3 dias | 🟢 Baixa |
| 5 | Melhorias e Automações | 2 dias | 🟢 Baixa |

**Total Estimado:** ~11 dias de desenvolvimento

---

## ✅ **CRITÉRIOS DE SUCESSO**

- [ ] Operador consegue ver fila do seu setor
- [ ] Operador consegue iniciar múltiplos produtos
- [ ] Produto avança automaticamente entre setores
- [ ] Gestor vê overview em tempo real
- [ ] Produtos com workflows diferentes na mesma OS
- [ ] Sistema identifica gargalos automaticamente
- [ ] Métricas de produtividade disponíveis

---

## 🔄 **ESTADO ATUAL (21/10/2025)**

### ✅ **Implementado:**
- Sistema de OS básico
- Liberação de produtos para PCP (individual)
- Status de produtos (LIBERADO, PENDENTE)
- Modal de seleção de workflow (básico)
- API de workflows disponíveis

### 🚧 **Em Implementação:**
- Workflows funcionais
- Tela do PCP (parcial)

### 📋 **Pendente:**
- Cadastro de Setores Produtivos
- Vinculação Setores → Workflows
- Tela de Fila por Setor
- Kanban Gerencial

---

## 📚 **REFERÊNCIAS**

- Schema Prisma: `backend/prisma/schema.prisma`
- Interfaces OS: `backend/src/os/interfaces/os.interfaces.ts`
- Controller PCP: `backend/src/os/controllers/liberacao-pcp.controller.ts`
- Página PCP: `frontend/src/app/(main)/pcp/page.tsx`

---

**Última Atualização:** 21/10/2025  
**Responsável:** Equipe de Desenvolvimento  
**Revisão:** Pendente

