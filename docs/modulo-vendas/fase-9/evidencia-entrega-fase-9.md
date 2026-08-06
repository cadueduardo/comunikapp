# Evidência — Fase 9 (Aditivos Comerciais e OS Aditiva)

**Data:** 2026-08-06
**Módulo:** Módulo de Vendas (Fase 9)
**Escopo:** Decisão Comercial de Ocorrências, Precificação RBAC, Geração de OS Aditiva e Interface Frontend de Aditivos

---

## 1. Descrição da Entrega

Implementada a governança comercial de aditivos e OS Aditiva (RP §§4.2–4.3, 5.3.1–5.3.3):

- **Service de Aditivos:** [aditivos-comerciais.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/aditivos-comerciais.service.ts) reutilizando `InstalacaoSplitFinanceiroService`.
- **Suíte de Testes:** [aditivos-comerciais.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/aditivos-comerciais.service.spec.ts).
- **DTOs:** [precificar-ocorrencia.dto.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/dto/precificar-ocorrencia.dto.ts) e [gerar-os-aditiva.dto.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/dto/gerar-os-aditiva.dto.ts).
- **Controller:** [aditivos-vendas.controller.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/controllers/aditivos-vendas.controller.ts) com endpoints sob `/vendas/aditivos`.
- **Frontend Page & Components:** [vendas/aditivos/page.tsx](file:///c:/Projects/comunikapp/frontend/src/app/(main)/vendas/aditivos/page.tsx), [aditivos-table.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/aditivos-table.tsx) e [aditivos-cards.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/aditivos-cards.tsx).

---

## 2. Invariantes Mantidas

1. **Imutabilidade da OS Principal:**
   - A OS pai do pedido original não é reaberta nem alterada. Aditivos geram exclusivamente uma OS Aditiva vinculada (`os_pai_id`).
2. **Idempotência de Ocorrência Faturada:**
   - Ocorrências já faturadas ou vinculadas a uma OS Aditiva não podem ser reutilizadas em novos aditivos.
3. **Controle de Abonos por Alçada RBAC:**
   - O abono de ocorrências exige a permissão `vendas.alcada.aprovar` (Gestor/Admin Comercial).
4. **Respeito ao Template de CRUD Frontend:**
   - Desktop inicia em visão de tabela com toggle para cards; mobile utiliza cards obrigatoriamente sem toggle visível.

---

## 3. Resultados das Validações

### 3.1 Testes Unitários de Aditivos
```text
npm test -- backend/src/orcamentos-v2/services/aditivos-comerciais.service.spec.ts
```
**Resultado:** 4 testes aprovados (100% de sucesso).
- √ 1. lista ocorrências operacionais pendentes para aditivo
- √ 2. precifica ocorrência operacional com valor comercial
- √ 3. impede reprecificação de ocorrência já vinculada a uma OS Aditiva
- √ 4. gera OS Aditiva e cobrança vinculadas sem alterar a OS pai

### 3.2 Compilações de Produção
- **Backend:** `nest build` concluído com sucesso.
- **Frontend:** `next build` concluído com sucesso (37/37 páginas geradas).

---

## 4. Arquivos Criados/Modificados na Fase 9

- `[NEW]` [aditivos-comerciais.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/aditivos-comerciais.service.ts)
- `[NEW]` [aditivos-comerciais.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/aditivos-comerciais.service.spec.ts)
- `[NEW]` [precificar-ocorrencia.dto.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/dto/precificar-ocorrencia.dto.ts)
- `[NEW]` [gerar-os-aditiva.dto.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/dto/gerar-os-aditiva.dto.ts)
- `[NEW]` [aditivos-vendas.controller.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/controllers/aditivos-vendas.controller.ts)
- `[MODIFY]` [orcamentos-v2.module.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/orcamentos-v2.module.ts)
- `[MODIFY]` [vendas-permissoes.ts](file:///c:/Projects/comunikapp/backend/src/vendas/permissions/vendas-permissoes.ts)
- `[NEW]` [vendas/aditivos/page.tsx](file:///c:/Projects/comunikapp/frontend/src/app/(main)/vendas/aditivos/page.tsx)
- `[NEW]` [aditivos-table.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/aditivos-table.tsx)
- `[NEW]` [aditivos-cards.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/vendas/aditivos-cards.tsx)
