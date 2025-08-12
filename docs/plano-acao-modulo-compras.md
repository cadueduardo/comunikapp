# Plano de Ação - Módulo de Compras

## 📋 Visão Geral

**Objetivo:** Implementar módulo de gestão de compras com pedidos, fornecedores, aprovações e integração com estoque.

**Duração:** 3 semanas (15 dias úteis)

**Arquitetura:** Modular com arquivos organizados (máximo 1000 linhas)

---

## 🗓️ Cronograma Detalhado

### **Fase 1: Estrutura Base** 
**Duração:** Semana 1 (Dias 1-5)

#### **Dia 1: Setup Inicial**
- [ ] **Criar estrutura de diretórios**
  - [ ] `backend/src/compras/`
  - [ ] `backend/src/compras/controllers/`
  - [ ] `backend/src/compras/services/`
  - [ ] `backend/src/compras/dto/`
  - [ ] `backend/src/compras/interfaces/`
  - [ ] `backend/src/compras/enums/`

- [ ] **Definir interfaces principais**
  - [ ] `interfaces/fornecedor.interface.ts`
  - [ ] `interfaces/pedido.interface.ts`
  - [ ] `interfaces/item-pedido.interface.ts`
  - [ ] `interfaces/aprovacao.interface.ts`

#### **Dia 2: Entidades e DTOs**
- [ ] **Implementar DTOs de validação**
  - [ ] `dto/create-fornecedor.dto.ts`
  - [ ] `dto/update-fornecedor.dto.ts`
  - [ ] `dto/create-pedido.dto.ts`
  - [ ] `dto/update-pedido.dto.ts`
  - [ ] `dto/aprovacao.dto.ts`

- [ ] **Criar entidades do banco**
  - [ ] Schema Prisma para Fornecedor
  - [ ] Schema Prisma para Pedido
  - [ ] Schema Prisma para ItemPedido
  - [ ] Schema Prisma para Aprovacao

#### **Dia 3: Serviços Básicos**
- [ ] **Implementar serviços**
  - [ ] `services/fornecedores.service.ts` (~400 linhas)
  - [ ] `services/pedidos.service.ts` (~400 linhas)
  - [ ] `services/aprovacoes.service.ts` (~400 linhas)
  - [ ] `services/notificacoes.service.ts` (~400 linhas)

#### **Dia 4: Controllers**
- [ ] **Implementar controllers**
  - [ ] `controllers/fornecedores.controller.ts` (~300 linhas)
  - [ ] `controllers/pedidos.controller.ts` (~300 linhas)
  - [ ] `controllers/aprovacoes.controller.ts` (~300 linhas)

#### **Dia 5: Módulo e Testes Básicos**
- [ ] **Criar módulo principal**
  - [ ] `compras.module.ts` (~200 linhas)
  - [ ] Configuração de dependências
  - [ ] Testes unitários básicos

---

### **Fase 2: Pedidos e Aprovações**
**Duração:** Semana 2 (Dias 6-10)

#### **Dia 6: Sistema de Pedidos**
- [ ] **Implementar pedidos**
  - [ ] Criação de pedidos
  - [ ] Adição de itens
  - [ ] Cálculo de totais
  - [ ] Validação de dados

#### **Dia 7: Workflow de Aprovação**
- [ ] **Sistema de aprovações**
  - [ ] Fluxo de aprovação
  - [ ] Níveis de aprovação
  - [ ] Notificações de aprovação
  - [ ] Histórico de aprovações

#### **Dia 8: Fornecedores**
- [ ] **Gestão de fornecedores**
  - [ ] CRUD de fornecedores
  - [ ] Avaliação de fornecedores
  - [ ] Histórico de compras
  - [ ] Contatos e informações

#### **Dia 9: Cotações**
- [ ] **Sistema de cotações**
  - [ ] Solicitação de cotações
  - [ ] Comparação de preços
  - [ ] Seleção de fornecedor
  - [ ] Histórico de cotações

#### **Dia 10: Testes de Pedidos**
- [ ] **Testes de pedidos**
  - [ ] Testes de criação
  - [ ] Testes de aprovação
  - [ ] Testes de fornecedores
  - [ ] Testes de cotações

---

### **Fase 3: Integração e Relatórios**
**Duração:** Semana 3 (Dias 11-15)

#### **Dia 11: Integração com Estoque**
- [ ] **Vínculo com estoque**
  - [ ] Detecção de falta de estoque
  - [ ] Sugestão de compras
  - [ ] Atualização automática
  - [ ] Sincronização de dados

#### **Dia 12: Relatórios de Compras**
- [ ] **Relatórios básicos**
  - [ ] Pedidos por período
  - [ ] Gastos por fornecedor
  - [ ] Produtos mais comprados
  - [ ] Análise de preços

#### **Dia 13: Notificações**
- [ ] **Sistema de notificações**
  - [ ] Notificações de aprovação
  - [ ] Alertas de prazo
  - [ ] Notificações de recebimento
  - [ ] Relatórios automáticos

#### **Dia 14: Dashboard e Gráficos**
- [ ] **Dashboard de compras**
  - [ ] Gráficos de gastos
  - [ ] Indicadores de performance
  - [ ] Alertas visuais
  - [ ] Filtros avançados

#### **Dia 15: Deploy e Validação**
- [ ] **Deploy e validação**
  - [ ] Deploy em ambiente de teste
  - [ ] Validação de funcionalidades
  - [ ] Testes de integração
  - [ ] Correções finais

---

## 📊 Métricas de Progresso

### **Fase 1: Estrutura Base**
- **Progresso:** 0/5 dias
- **Arquivos criados:** 0/15
- **Funcionalidades:** 0/4

### **Fase 2: Pedidos e Aprovações**
- **Progresso:** 0/5 dias
- **Pedidos:** 0/4
- **Testes:** 0/4

### **Fase 3: Integração e Relatórios**
- **Progresso:** 0/5 dias
- **Integração:** 0/4
- **Relatórios:** 0/4

---

## 🚨 Riscos e Mitigações

### **Riscos Identificados:**
1. **Complexidade do workflow de aprovação**
   - **Mitigação:** Implementar gradualmente, testando cada nível

2. **Integração com estoque**
   - **Mitigação:** Usar eventos e hooks para sincronização

3. **Performance com muitos pedidos**
   - **Mitigação:** Paginação e índices adequados

4. **Validação de dados**
   - **Mitigação:** Validações robustas e transações

---

## 📋 Checklist Final

### **Funcionalidades Básicas:**
- [ ] CRUD completo de fornecedores
- [ ] CRUD completo de pedidos
- [ ] Validação de dados
- [ ] Histórico de operações

### **Pedidos:**
- [ ] Criação de pedidos
- [ ] Adição de itens
- [ ] Cálculo de totais
- [ ] Validação de dados

### **Aprovações:**
- [ ] Workflow de aprovação
- [ ] Níveis de aprovação
- [ ] Notificações
- [ ] Histórico de aprovações

### **Integração:**
- [ ] Integração com estoque
- [ ] Detecção de falta
- [ ] Sugestão de compras
- [ ] Sincronização automática

---

## 🎯 Critérios de Sucesso

### **Técnicos:**
- ✅ Todos os arquivos com menos de 1000 linhas
- ✅ Cobertura de testes > 80%
- ✅ Performance adequada
- ✅ Integridade de dados

### **Funcionais:**
- ✅ CRUD completo funcionando
- ✅ Workflow de aprovação
- ✅ Integração com estoque
- ✅ Relatórios funcionando

### **Qualidade:**
- ✅ Código bem documentado
- ✅ Arquitetura modular
- ✅ Fácil manutenção
- ✅ Escalabilidade

---

## 📝 Notas de Atualização

**Data:** [Data de início]
**Responsável:** [Nome do responsável]
**Status:** Aguardando início

**Atualizações:**
- [Data] - [Descrição da atualização] 