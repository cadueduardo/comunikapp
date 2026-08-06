# Evidência — Incremento 6.7 (Frontend do Pipeline)

**Data:** 2026-08-06
**Módulo:** Módulo de Vendas (Fase 6)
**Escopo:** Superfície Visual do Pipeline de Orçamentos V2, Filtros Canônicos e Responsividade

---

## 1. Descrição da Entrega

Finalizada a implementação da interface do pipeline comercial de Vendas V2 no frontend:

- **Página de Listagem:** [page.tsx](file:///c:/Projects/comunikapp/frontend/src/app/(main)/orcamentos-v2/page.tsx).
- **Tabela Desktop:** [orcamentos-v2-table.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/orcamentos-v2/orcamentos-v2-table.tsx).
- **Cards Responsivos:** [orcamentos-v2-cards.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/orcamentos-v2/orcamentos-v2-cards.tsx).

---

## 2. Garantias e Regras de UX Atendidas

1. **Template Obrigatório de CRUD (AGENTS.md):**
   - **Desktop:** Inicia por padrão na visão de **Tabela/Grid** (`viewMode = 'table'`) e disponibiliza alternância (`ViewToggle`) para visão de **Cards**.
   - **Mobile:** Força automaticamente a visão de **Cards** (`isMobile === true`) e oculta o botão de alternância.
   - Não força cards em novas sessões desktop e não rende tabela comprimida no mobile.
2. **Status Canônicos DV-14:**
   - Suporte completo às 10 fases comerciais (`rascunho`, `aguardando_alcada`, `enviada`, `em_negociacao`, `revisao_solicitada`, `expirada`, `aceita`, `pedido_confirmado`, `perdida`, `cancelada`) com resolução de cores compatíveis com **Dark Mode** e **Light Mode**.
3. **Consistência de Ações e Permissões:**
   - Ações idênticas em Tabela e Cards (Editar, Duplicar, Compartilhar e Excluir via `DeleteOrcamentoDialog`).
4. **Sem Dados Mockados:**
   - Integração direta com a API V2 via `useOrcamentosV2` e `orcamentosApi.v2`.

---

## 3. Validações Executadas

- **Next.js Build:** `next build` concluído com sucesso (`37/37` páginas estáticas geradas).
- **Evidência Registrada:** `docs/modulo-vendas/fase-6/evidencia-entrega-6-7.md`.
