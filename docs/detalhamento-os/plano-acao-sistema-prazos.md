# 📋 Plano de Ação: Sistema de Prazos e Validações - Detalhamento de OS

## 📅 Data de Criação: 09/10/2025

---

## 🎯 Objetivo Geral

Implementar um sistema completo de gerenciamento de prazos para Ordens de Serviço (OS), com validações dinâmicas e integração com o módulo PCP, garantindo controle total sobre o ciclo de vida da produção.

---

## 🏗️ Arquitetura do Sistema

### **Separação de Responsabilidades**

```
┌─────────────────────────────────────────────────────────────┐
│ MÓDULO OS (Gestão de Ordem de Serviço)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Vendedor → Define prazo final com cliente               │
│    data_prazo_final = "15/12/2025"                         │
│                                                             │
│ 2. Gestão OS → Organiza produtos e define prazos           │
│    - Produto A: início = "01/12", prazo = "10/12"         │
│    - Produto B: início = "05/12", prazo = "12/12"         │
│    - Produto C: início = "08/12", prazo = "14/12"         │
│                                                             │
│ 3. Gestão OS → Valida e libera OS para PCP                 │
│    Status: LIBERADA_PCP                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ MÓDULO PCP (Planejamento e Controle de Produção)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 4. PCP → Recebe fila organizada por data                   │
│    Kanban com produtos ordenados                            │
│                                                             │
│ 5. PCP → Gerencia produção (workflows, etapas)             │
│    - Inicia produtos                                        │
│    - Acompanha progresso                                    │
│    - Faz apontamentos                                       │
│                                                             │
│ 6. Problema? → PCP reorganiza internamente                 │
│    (sem alterar prazo final da OS)                         │
│                                                             │
│ 7. Precisa mudar prazo final? → Volta para Gestão OS       │
│    PCP solicita alteração → Gestão OS aprova/rejeita       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Estrutura de Dados

### **1. Tabela OrdemServico**
```prisma
model OrdemServico {
  // ... campos existentes ...
  
  // PRAZOS
  data_prazo         DateTime?  // RENOMEAR PARA: data_prazo_final
  data_liberacao_pcp DateTime?  // Quando foi liberada para PCP
  
  // STATUS
  status             String     // RASCUNHO, AGUARDANDO_PRAZOS, PRONTA_LIBERAR, 
                                // LIBERADA_PCP, EM_PRODUCAO, CONCLUIDA, ENTREGUE
}
```

### **2. Tabela ItemOS (Produtos)**
```prisma
model ItemOS {
  // ... campos existentes ...
  
  // PRAZOS DO PRODUTO
  data_inicio_producao   DateTime?  // Quando deve iniciar produção
  data_prazo_produto     DateTime?  // Prazo específico deste produto
  
  // LIBERAÇÃO PCP
  status_liberacao_pcp   String?    // PENDENTE, LIBERADO, EM_PRODUCAO, CONCLUIDO
  liberado_pcp_por       String?    // usuario_id
  liberado_pcp_em        DateTime?  // Data de liberação
  
  // PRIORIDADE
  prioridade_produto     String?    // URGENTE, ALTA, NORMAL, BAIXA
  ordem_producao         Int?       // Ordem de produção (1, 2, 3...)
}
```

### **3. Tabela OrdemServicoLog (Auditoria)**
```prisma
model OrdemServicoLog {
  id           String    @id @default(cuid())
  os_id        String
  tipo_acao    String    // PRAZO_RETROATIVO, LIBERACAO_PCP, ALTERACAO_PRAZO
  descricao    String    @db.Text
  dados_extras String?   @db.LongText // JSON com detalhes
  ip_origem    String?
  user_agent   String?
  criado_em    DateTime  @default(now())
  usuario_id   String?
  
  // Relacionamentos
  os           OrdemServico @relation(fields: [os_id], references: [id], onDelete: Cascade)
  usuario      usuario?     @relation(fields: [usuario_id], references: [id])
}
```

---

## 🔐 Regras de Negócio

### **1. Definição de Prazos**

#### **Quem Define:**
- **Vendedor/Comercial**: Define `data_prazo_final` (compromisso com cliente)
- **Gestão OS/PCP**: Define `data_inicio_producao` de cada produto

#### **Validações:**
- ✅ Prazo de produto **DEVE SER** ≤ prazo final da OS
- ✅ Sistema **BLOQUEIA** se prazo de produto > prazo final
- ✅ Mensagem: *"O prazo do produto não pode ser maior que o prazo final da OS. Ajuste o prazo final primeiro."*

### **2. Datas Retroativas**

#### **Permissões:**
- ✅ Qualquer operador com acesso ao módulo pode definir
- ✅ **TODAS** as ações são monitoradas e logadas

#### **Fluxo:**
1. Usuário tenta definir data passada
2. Sistema exibe modal de confirmação
3. Usuário confirma (ou cancela)
4. Sistema registra em log:
   - Usuário que definiu
   - Data definida vs. data atual
   - IP de origem
   - User-Agent
   - Motivo (se informado)

### **3. Estados da OS**

```typescript
enum StatusOS {
  RASCUNHO,           // Vendedor criando
  AGUARDANDO_PRAZOS,  // Precisa definir prazos dos produtos
  PRONTA_LIBERAR,     // Tudo definido, pode liberar
  LIBERADA_PCP,       // PCP recebeu
  EM_PRODUCAO,        // PCP iniciou produção
  CONCLUIDA,          // Tudo pronto
  ENTREGUE            // Cliente recebeu
}
```

### **4. Liberação para PCP**

#### **Validações Obrigatórias:**
```
Checklist para liberar OS ao PCP:
✅ Prazo final definido
✅ Todos os produtos têm prazo de produção
✅ Todos os prazos de produto <= prazo final
✅ Materiais disponíveis (ou em processo)
✅ Arte aprovada (se aplicável)
```

#### **Liberação Parcial:**
- ✅ Pode liberar produto por produto
- ✅ Flexibilidade para OSs em andamento
- ✅ Botão "Liberar para PCP" em cada produto

### **5. Mudança de Prazo Durante Produção**

#### **Prática de Mercado:**
- **OS em Produção**: PCP tem autonomia para reorganizar internamente
- **Mudança de Prazo Final**: Requer aprovação/alteração da OS (volta para comercial)
- **Motivo**: Prazo final é compromisso com cliente, mudá-lo é decisão comercial

#### **Fluxo de Alteração:**
```
1. PCP identifica necessidade de alterar prazo final
2. PCP solicita alteração (via sistema)
3. Gestão OS/Comercial analisa impacto
4. Gestão OS aprova/rejeita
5. Se aprovado: PCP reorganiza produtos
6. Sistema registra em log toda a operação
```

---

## 🎨 Interface do Usuário

### **1. Aba "Resumo" - Prazos**

```
┌─────────────────────────────────────┐
│ 📅 Prazo Final de Entrega           │
│ [15/12/2025] ✏️                     │
│ ⚠️ Data de entrega ao cliente       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📦 Produtos desta OS                │
│                                     │
│ ✓ Fachada ACM                       │
│   Início: 01/12  Prazo: 10/12      │
│   Status: EM_PRODUÇÃO               │
│   [Liberar para PCP]                │
│                                     │
│ ⏳ Banner Lona                       │
│   Início: 05/12  Prazo: 12/12      │
│   Status: AGUARDANDO                │
│   [Liberar para PCP]                │
│                                     │
│ 📋 Painel LED                        │
│   Início: 08/12  Prazo: 14/12      │
│   Status: AGUARDANDO                │
│   [Liberar para PCP]                │
└─────────────────────────────────────┘
```

### **2. Aba "Análise Inteligente" - Validações Dinâmicas**

```
┌─────────────────────────────────────────────────────────┐
│ ABA: Análise Inteligente (Validações)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Status Geral da OS                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⚠️  ATENÇÃO - 3 pendências impedem liberação  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ✅ Validações Aprovadas (4)                           │
│  ├─ ✅ Dados Obrigatórios                              │
│  ├─ ✅ Especificações Técnicas                         │
│  ├─ ✅ Cliente Ativo                                   │
│  └─ ✅ Orçamento Aprovado                              │
│                                                         │
│  ⚠️  Validações Pendentes (3)                          │
│  ├─ ⚠️  Prazo Final não definido                       │
│  │    └─ Ação: Definir prazo de entrega               │
│  ├─ ⚠️  2 produtos sem prazo de produção               │
│  │    └─ Produtos: Fachada ACM, Banner Lona           │
│  └─ ⚠️  3 materiais em falta no estoque                │
│      └─ Materiais: ACM Branco (2 chapas), Lona...     │
│                                                         │
│  ❌ Validações Bloqueadas (0)                          │
│  └─ (nenhuma)                                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Liberar para PCP] (DESABILITADO)             │   │
│  │  ⚠️ Resolva as pendências antes de liberar      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **3. Disclaimers (Alertas)**

#### **Disclaimer 1: Prazo Final**
```
⚠️ O prazo final de entrega não foi definido. 
   Defina uma data para organizar a produção.
```

#### **Disclaimer 2: Prazos de Produtos**
```
⚠️ 2 produtos sem prazo de produção definido:
   • Fachada ACM
   • Banner Lona
   
   Defina os prazos para liberar ao PCP.
```

---

## 🔧 Implementação Técnica

### **Backend - APIs**

#### **Endpoints de Prazo da OS:**
```typescript
POST   /os/prazo/:id/definir          // Define prazo final da OS
PUT    /os/prazo/:id/atualizar        // Atualiza prazo final
GET    /os/prazo/:id/status           // Consulta status do prazo
GET    /os/prazo/:id/logs             // Logs de alterações
```

#### **Endpoints de Prazo de Produtos:**
```typescript
POST   /os/produtos/:itemId/definir-prazo    // Define prazo do produto
PUT    /os/produtos/:itemId/atualizar-prazo  // Atualiza prazo
GET    /os/produtos/:itemId/status-prazo     // Status do prazo
```

#### **Endpoints de Liberação PCP:**
```typescript
POST   /os/:id/liberar-pcp                   // Libera OS completa
POST   /os/produtos/:itemId/liberar-pcp      // Libera produto específico
GET    /os/:id/validar-liberacao             // Valida se pode liberar
GET    /os/:id/status-liberacao              // Status de liberação
```

#### **Endpoints de Validações:**
```typescript
GET    /os/:id/validacoes-completas          // Todas as validações
GET    /os/:id/validacoes/resumo             // Resumo (aprovadas/pendentes/bloqueadas)
POST   /os/:id/validacoes/executar           // Força execução de validações
```

### **Frontend - Componentes**

#### **Componentes de Prazo:**
```typescript
<PrazoOSComponent />              // Prazo final da OS (já implementado)
<PrazoProdutoComponent />         // Prazo de produto individual
<ListaProdutosComPrazo />         // Lista de produtos com prazos
<DisclaimerPrazos />              // Alertas de prazos pendentes
```

#### **Componentes de Validação:**
```typescript
<ValidacoesOSTab />               // Aba completa de validações
<StatusGeralValidacoes />         // Status geral (termômetro)
<ValidacoesAprovadas />           // Lista de validações OK
<ValidacoesPendentes />           // Lista de pendências
<ValidacoesBloqueadas />          // Lista de bloqueios
<BotaoLiberarPCP />               // Botão com validações
```

---

## 📋 Fases de Implementação

### **✅ Fase 1: Sistema de Prazos (CONCLUÍDA)**
- [x] Tabela `OrdemServicoLog` criada
- [x] Backend: Controller, Service, DTOs
- [x] Frontend: Componente `PrazoOSComponent`
- [x] Validações de data (hoje, futuro, passado)
- [x] Modal de confirmação para datas retroativas
- [x] Sistema de logs para auditoria
- [x] Integração na aba "Resumo"

### **✅ Fase 2: Prazos por Produto (CONCLUÍDA)**
- [x] Ajustar schema: adicionar campos em `ItemOS`
- [x] Backend: APIs de prazo por produto
- [x] Frontend: Componente `PrazoProdutoComponent`
- [x] Frontend: Lista de produtos com prazos
- [x] Validação: prazo produto <= prazo final
- [x] Disclaimers dinâmicos

### **⏳ Fase 3: Validações Dinâmicas (PRÓXIMA)**
- [ ] Backend: Sistema de validações completo
- [ ] Backend: Endpoint de validações agregadas
- [ ] Frontend: Aba "Análise Inteligente"
- [ ] Frontend: Termômetro de prontidão
- [ ] Frontend: Listas de validações por status
- [ ] Integração com validações existentes

### **⏳ Fase 4: Liberação para PCP (FUTURA)**
- [ ] Backend: Endpoint de liberação
- [ ] Backend: Validações pré-liberação
- [ ] Frontend: Botão "Liberar para PCP"
- [ ] Frontend: Modal de confirmação
- [ ] Integração: Criar workflows no PCP
- [ ] Notificações: PCP recebe OS

### **⏳ Fase 5: Gestão de Mudanças (FUTURA)**
- [ ] Backend: Solicitação de alteração de prazo
- [ ] Backend: Aprovação/rejeição de alteração
- [ ] Frontend: Interface de solicitação
- [ ] Frontend: Interface de aprovação
- [ ] Logs de mudanças
- [ ] Notificações

---

## 🎯 Categorias de Validação

### **1. Dados da OS**
```typescript
✅ Dados obrigatórios preenchidos
✅ Cliente ativo
✅ Orçamento aprovado (se aplicável)
⚠️  Prazo final não definido
⚠️  Produtos sem prazo
```

### **2. Arte & Aprovação**
```typescript
✅ Todas as artes aprovadas
⚠️  Aguardando aprovação do cliente
❌ Arte rejeitada (precisa nova versão)
🔄 Em análise
```

### **3. Materiais & Estoque**
```typescript
✅ Todos os materiais disponíveis
⚠️  Materiais em falta (mas em compra)
❌ Materiais críticos em falta
🔄 Calculando materiais
```

### **4. Especificações Técnicas**
```typescript
✅ Especificações completas
⚠️  Especificações parciais
❌ Especificações obrigatórias faltando
```

### **5. Prazos**
```typescript
✅ Prazo final definido
✅ Todos os produtos com prazo
⚠️  Prazo apertado (< 3 dias)
❌ Prazo expirado
⚠️  Produtos sem prazo definido
```

---

## 📊 Ícones e Status

### **Status Geral:**
```
🔴 BLOQUEADO           → Tem validações críticas (impede liberação)
🟡 ATENÇÃO             → Tem pendências (alerta, mas não bloqueia)
🟢 PRONTO PARA LIBERAR → Tudo OK!
```

### **Ícones por Validação:**
```
✅ = Aprovado
⚠️ = Atenção (não bloqueia, mas alerta)
❌ = Bloqueado (impede liberação)
🔄 = Em análise
⏳ = Aguardando
```

---

## 🔐 Segurança e Auditoria

### **Logs Obrigatórios:**
1. **Datas Retroativas**: Todas as definições de datas passadas
2. **Liberação PCP**: Quem liberou, quando, quais produtos
3. **Alteração de Prazo**: Mudanças no prazo final ou de produtos
4. **Validações Críticas**: Tentativas de liberar sem validações

### **Informações Capturadas:**
- `usuario_id`: Quem executou a ação
- `ip_origem`: IP de onde veio a requisição
- `user_agent`: Navegador/dispositivo usado
- `timestamp`: Data e hora exata
- `dados_extras`: Contexto adicional (JSON)

---

## 📝 Notas Importantes

### **Prioridades:**
1. **Alta**: Sistema de prazos (OS + Produtos)
2. **Alta**: Validações dinâmicas
3. **Média**: Liberação para PCP
4. **Baixa**: Gestão de mudanças

### **Dependências:**
- Módulo PCP já existe e está funcional
- Sistema de validações já existe (precisa expandir)
- Sistema de logs já implementado

### **Próximos Passos:**
1. Implementar prazos por produto
2. Criar aba de validações dinâmicas
3. Implementar botão de liberação para PCP
4. Testar integração completa OS ↔ PCP

---

## 📚 Referências

- **Wireframe**: `docs/wireframe/descricao_abas_os_comunikapp.md`
- **Premissas**: `docs/premissas melhores praticas.md`
- **Schema Prisma**: `backend/prisma/schema.prisma`
- **Módulo OS**: `backend/src/os/`
- **Módulo PCP**: `backend/src/pcp/`

---

**Última Atualização**: 09/10/2025
**Status**: Em Desenvolvimento
**Responsável**: Equipe de Desenvolvimento

