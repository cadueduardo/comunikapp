# Plano de Ação - Recursos Restantes do Módulo de Estoque

**Baseado em:** PBI Estoque v4 (PT-BR) - Atualizado com Registro de Sobras  
**Data:** 08/08/2025  
**Status:** Em desenvolvimento  

---

## 📊 **Resumo do Status Atual**

### 🛠️ Correções recentes
- 11/08/2025: Gerar `codigo` automaticamente ao criar item de estoque quando não informado para evitar erro MySQL 1048 (Column 'codigo' cannot be null). Arquivo afetado: `backend/src/estoque/services/estoque-simple.service.ts` (método `criarItemEstoque`).

### ✅ **Já Implementado:**
- ✅ Dashboard principal com KPIs
- ✅ CRUD completo de itens de estoque
- ✅ CRUD completo de localizações
- ✅ Movimentações (entrada, saída, ajuste)
- ✅ Páginas de entrada e saída de movimentações
- ✅ Formatação melhorada de localizações
- ✅ Botões "Voltar" em todas as páginas
- ✅ Integração com insumos e fornecedores
- ✅ Validação de exclusão de localizações
- ✅ Dashboard com dados reais

### ❌ **Recursos Restantes para Implementar:**

---

## 🎯 **FASE 1 - Funcionalidades Críticas (Prioridade Alta)**

### **1. Relatórios Funcionais**
**Status:** ✅ **IMPLEMENTADO**  
**Problema:** Página existe mas retorna dados mockados

**Tarefas:**
- [x] Implementar endpoint `/api/estoque/relatorios/baixo` no backend
- [x] Implementar endpoint `/api/estoque/relatorios/vencimento` no backend
- [x] Implementar endpoint `/api/estoque/relatorios/ocupacao` no backend
- [x] Corrigir página de relatórios para usar dados reais
- [ ] Adicionar filtros e exportação nos relatórios

**Arquivos modificados:**
- ✅ `backend/src/estoque/services/estoque-simple.service.ts` - Métodos de relatórios implementados
- ✅ `backend/src/estoque/controllers/relatorios.controller.ts` - Novo controller criado
- ✅ `backend/src/estoque/estoque.module.ts` - Controller adicionado ao módulo
- ✅ `frontend/src/app/(main)/estoque/relatorios/page.tsx` - Endpoints corrigidos

---

### **2. Controle de Lotes Robusto**
**Status:** ✅ **IMPLEMENTADO**  
**Problema:** Campos existem mas sem gestão completa

**Tarefas:**
- [x] Implementar modelo `EstoqueLote` no schema Prisma
- [x] Criar endpoints para CRUD de lotes
- [x] Adicionar página de gestão de lotes
- [x] Implementar alertas de vencimento
- [x] Integrar com movimentações (FIFO/LIFO)

**Arquivos criados/modificados:**
- ✅ `backend/src/estoque/controllers/lotes.controller.ts` - Controller completo criado
- ✅ `backend/src/estoque/services/estoque-simple.service.ts` - Métodos de lotes implementados
- ✅ `backend/src/estoque/estoque.module.ts` - Controller adicionado ao módulo
- ✅ `frontend/src/app/(main)/estoque/lotes/page.tsx` - Página de listagem criada
- ✅ `frontend/src/app/(main)/estoque/lotes/novo/page.tsx` - Página de criação criada

---

### **3. Transferências entre Localizações**
**Status:** ✅ **IMPLEMENTADO**  
**Problema:** Tipo de movimentação não existe

**Tarefas:**
- [x] Adicionar tipo "TRANSFERENCIA" nas movimentações
- [x] Criar página de nova transferência
- [x] Implementar validação de saldo disponível
- [x] Adicionar histórico de transferências
- [x] Integrar com movimentações existentes

**Arquivos criados/modificados:**
- ✅ `backend/src/estoque/controllers/transferencias.controller.ts` - Controller completo criado
- ✅ `backend/src/estoque/services/estoque-simple.service.ts` - Métodos de transferência implementados
- ✅ `backend/src/estoque/estoque.module.ts` - Controller adicionado ao módulo
- ✅ `frontend/src/app/(main)/estoque/transferencias/nova/page.tsx` - Página de nova transferência criada
- ✅ `frontend/src/app/(main)/estoque/transferencias/page.tsx` - Página de listagem criada

---

## 🎯 **FASE 2 - Funcionalidades Específicas do Setor (Prioridade Média)**

### **4. Registro de Sobras e Retalhos**
**Status:** ✅ **IMPLEMENTADO**  
**Problema:** Funcionalidade específica do setor de comunicação visual

**Tarefas:**
- [x] Implementar modelo `EstoqueSobra` no schema Prisma
- [x] Criar endpoints para CRUD de sobras
- [x] Implementar algoritmo de sugestões de uso
- [x] Criar página de gestão de sobras
- [x] Integrar com orçamentos para sugestões
- [x] Adicionar métricas de economia

**Arquivos criados/modificados:**
- ✅ `backend/src/generated/estoque-client/schema.prisma` - Modelos EstoqueSobra e EstoqueAproveitamento adicionados
- ✅ `backend/src/estoque/controllers/sobras.controller.ts` - Controller completo criado
- ✅ `backend/src/estoque/services/sobras.service.ts` - Service com queries SQL diretas criado
- ✅ `backend/src/estoque/estoque.module.ts` - Controller e service adicionados ao módulo
- ✅ `frontend/src/app/(main)/estoque/sobras/page.tsx` - Página de listagem criada
- ✅ `frontend/src/app/(main)/estoque/sobras/novo/page.tsx` - Página de criação criada

**Como acessar:**
- Dashboard principal: `/estoque` - Cards de acesso adicionados
- Lotes: `/estoque/lotes` - Listagem e `/estoque/lotes/novo` - Criação
- Transferências: `/estoque/transferencias` - Listagem e `/estoque/transferencias/nova` - Nova transferência
- Sobras: `/estoque/sobras` - Listagem e `/estoque/sobras/novo` - Nova sobra

---

### **5. Gráficos no Dashboard**
**Status:** ❌ Não implementado  
**Problema:** Apenas cards, sem visualizações gráficas

**Tarefas:**
- [ ] Adicionar biblioteca de gráficos (Chart.js ou Recharts)
- [ ] Implementar gráfico de movimentações (entrada vs saída)
- [ ] Implementar gráfico de ocupação por depósito
- [ ] Implementar gráfico de giro de estoque
- [ ] Implementar gráfico de aproveitamento de sobras

**Arquivos a modificar:**
- `frontend/src/app/(main)/estoque/page.tsx` - Adicionar gráficos
- `frontend/package.json` - Adicionar dependência de gráficos

---

### **6. Alertas e Notificações**
**Status:** ❌ Não implementado  
**Problema:** Sistema não alerta sobre estoque baixo ou vencimentos

**Tarefas:**
- [ ] Implementar sistema de alertas em tempo real
- [ ] Criar notificações para estoque baixo
- [ ] Criar notificações para vencimentos próximos
- [ ] Implementar configuração de limites de alerta
- [ ] Integrar com WebSocket para atualizações

**Arquivos a criar/modificar:**
- `backend/src/estoque/services/alertas.service.ts` - Novo service
- `frontend/src/components/ui/alertas.tsx` - Novo componente
- `frontend/src/app/(main)/estoque/configuracoes/page.tsx` - Nova página

---

## 🎯 **FASE 3 - Melhorias e Otimizações (Prioridade Baixa)**

### **7. Filtros Avançados**
**Status:** ⚠️ Básico implementado  
**Problema:** Filtros limitados nas listagens

**Tarefas:**
- [ ] Implementar filtros avançados em itens de estoque
- [ ] Implementar filtros avançados em movimentações
- [ ] Implementar filtros avançados em localizações
- [ ] Adicionar busca por texto em todas as listagens
- [ ] Implementar filtros por data e período

**Arquivos a modificar:**
- `frontend/src/app/(main)/estoque/itens/page.tsx` - Melhorar filtros
- `frontend/src/app/(main)/estoque/movimentacoes/page.tsx` - Melhorar filtros
- `frontend/src/app/(main)/estoque/localizacoes/page.tsx` - Melhorar filtros

---

### **8. Exportação de Dados**
**Status:** ❌ Não implementado  
**Problema:** Não é possível exportar relatórios

**Tarefas:**
- [ ] Implementar exportação para PDF
- [ ] Implementar exportação para Excel
- [ ] Adicionar botões de exportação nos relatórios
- [ ] Implementar relatórios personalizados
- [ ] Adicionar opções de formatação

**Arquivos a criar/modificar:**
- `backend/src/estoque/services/exportacao.service.ts` - Novo service
- `frontend/src/components/ui/exportacao.tsx` - Novo componente

---

### **9. Integração com Orçamentos**
**Status:** ❌ Não implementado  
**Problema:** Não há integração com módulo de orçamentos

**Tarefas:**
- [ ] Implementar referência a orçamentos nas movimentações
- [ ] Criar sugestões de sobras baseadas em orçamentos
- [ ] Implementar reserva de estoque para orçamentos
- [ ] Adicionar histórico de uso por projeto

**Arquivos a modificar:**
- `backend/src/estoque/services/estoque-simple.service.ts` - Adicionar integração
- `frontend/src/app/(main)/estoque/movimentacoes/entrada/page.tsx` - Adicionar campo orçamento

---

### **10. Inventário Físico**
**Status:** ❌ Não implementado  
**Problema:** Não há funcionalidade de contagem física

**Tarefas:**
- [ ] Implementar funcionalidade de inventário
- [ ] Criar página de contagem física
- [ ] Implementar comparação com estoque teórico
- [ ] Criar relatórios de diferenças
- [ ] Implementar ajustes automáticos

**Arquivos a criar:**
- `backend/src/estoque/controllers/inventario.controller.ts` - Novo controller
- `backend/src/estoque/services/inventario.service.ts` - Novo service
- `frontend/src/app/(main)/estoque/inventario/page.tsx` - Nova página

---

## 📋 **Cronograma Sugerido**

### **Semana 1-2: FASE 1**
- **Dias 1-3:** Relatórios funcionais
- **Dias 4-7:** Controle de lotes robusto
- **Dias 8-10:** Transferências entre localizações

### **Semana 3-4: FASE 2**
- **Dias 11-14:** Registro de sobras e retalhos
- **Dias 15-17:** Gráficos no dashboard
- **Dias 18-20:** Alertas e notificações

### **Semana 5-6: FASE 3**
- **Dias 21-23:** Filtros avançados
- **Dias 24-26:** Exportação de dados
- **Dias 27-30:** Integração com orçamentos e inventário

---

## 🎯 **Critérios de Aceite por Fase**

### **FASE 1 - Critérios:**
- [ ] Relatórios retornam dados reais do banco
- [ ] Lotes têm gestão completa (CRUD + alertas)
- [ ] Transferências funcionam entre localizações
- [ ] Todas as funcionalidades testadas e funcionando

### **FASE 2 - Critérios:**
- [ ] Sobras registradas e gerenciadas corretamente
- [ ] Gráficos exibem dados reais e atualizados
- [ ] Alertas funcionam em tempo real
- [ ] Interface responsiva e intuitiva

### **FASE 3 - Critérios:**
- [ ] Filtros funcionam em todas as listagens
- [ ] Exportação gera arquivos corretos
- [ ] Integração com orçamentos funciona
- [ ] Inventário físico implementado

---

## 📊 **Métricas de Sucesso**

### **Técnicas:**
- [ ] 100% dos endpoints funcionando
- [ ] 0 erros de console no frontend
- [ ] Tempo de resposta < 2s para todas as operações
- [ ] Cobertura de testes > 80%

### **Funcionais:**
- [ ] Usuários conseguem registrar sobras facilmente
- [ ] Sistema sugere uso de sobras corretamente
- [ ] Alertas funcionam em tempo real
- [ ] Relatórios são úteis para tomada de decisão

---

**Este plano de ação garante a implementação completa do módulo de estoque conforme especificado no PBI v4, com foco em funcionalidades específicas do setor de comunicação visual e melhorias contínuas de usabilidade.**
