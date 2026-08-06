# Evidência — Fase 10 (Acompanhamento Comercial e Pontes de Leitura)

**Data:** 2026-08-06
**Módulo:** Módulo de Vendas (Fase 10)
**Escopo:** Projeção Read-Only de Pedidos Comerciais, Linha do Tempo Sequencial e Pontes de Leitura

---

## 1. Descrição da Entrega

Implementada a infraestrutura de acompanhamento comercial em tempo real para vendedores e gestores (RP §§4.4, 5.3.2, 6.3, 6.5.7–6.5.8):

- **Service de Acompanhamento:** [acompanhamento-comercial.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/acompanhamento-comercial.service.ts).
- **Suíte de Testes:** [acompanhamento-comercial.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/acompanhamento-comercial.service.spec.ts).
- **Controller:** [acompanhamento-vendas.controller.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/controllers/acompanhamento-vendas.controller.ts) com endpoints sob `/vendas/pedidos`.
- **Frontend Page & Components:** [vendas/pedidos/page.tsx](file:///c:/Projects/comunikapp/frontend/src/app/(main)/vendas/pedidos/page.tsx), [pedidos-table.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/pedidos-table.tsx), [pedidos-cards.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/pedidos-cards.tsx) e [timeline-pedido-dialog.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/timeline-pedido-dialog.tsx).

---

## 2. Invariantes Mantidas

1. **Projeção Puramente Read-Only:**
   - A tela de pedidos em `/vendas/pedidos` não permite alterar diretamente status operacionais do PCP, Instalação ou Contas a Pagar.
2. **Consolidação de Status Comercial:**
   - Exibição transparente do estado da Arte, Operação (OS principal + Aditivas) e Financeiro.
3. **Respeito ao Template de CRUD Frontend:**
   - Visão de tabela padrão no desktop com alternância para cards; cards forçados no mobile sem toggle.

---

## 3. Resultados das Validações

### 3.1 Testes Unitários de Acompanhamento
```text
npm test -- backend/src/orcamentos-v2/services/acompanhamento-comercial.service.spec.ts
```
**Resultado:** 3 testes aprovados (100% de sucesso).
- √ 1. lista pedidos comerciais confirmados com projeção consolidada de status
- √ 2. gera timeline comercial sequencial do pedido
- √ 3. nega acesso a timeline de pedido inexistente ou de outro tenant

### 3.2 Compilações de Produção
- **Backend:** `nest build` concluído com sucesso.
- **Frontend:** `next build` concluído com sucesso (37/37 páginas geradas).

---

## 4. Arquivos Criados/Modificados na Fase 10

- `[NEW]` [acompanhamento-comercial.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/acompanhamento-comercial.service.ts)
- `[NEW]` [acompanhamento-comercial.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/acompanhamento-comercial.service.spec.ts)
- `[NEW]` [acompanhamento-vendas.controller.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/controllers/acompanhamento-vendas.controller.ts)
- `[MODIFY]` [orcamentos-v2.module.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/orcamentos-v2.module.ts)
- `[MODIFY]` [vendas-permissoes.ts](file:///c:/Projects/comunikapp/backend/src/vendas/permissions/vendas-permissoes.ts)
- `[NEW]` [vendas/pedidos/page.tsx](file:///c:/Projects/comunikapp/frontend/src/app/(main)/vendas/pedidos/page.tsx)
- `[NEW]` [pedidos-table.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/pedidos-table.tsx)
- `[NEW]` [pedidos-cards.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/pedidos-cards.tsx)
- `[NEW]` [timeline-pedido-dialog.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/timeline-pedido-dialog.tsx)
