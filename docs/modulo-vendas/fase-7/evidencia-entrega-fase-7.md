# Evidência — Fase 7 (Governança de Preço, Desconto, Margem e Alçadas Comerciais)

**Data:** 2026-08-06
**Módulo:** Módulo de Vendas (Fase 7)
**Escopo:** Validação de Limites de Desconto, Alçadas Comerciais, Decisão do Gestor, Sanitização RBAC e Fila de Alçadas Frontend

---

## 1. Descrição da Entrega

Implementada a governança de preços, descontos, margem e alçadas comerciais (DV-04 / DV-05):

- **Service de Alçada:** [alcada-comercial.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/alcada-comercial.service.ts).
- **Suíte de Testes:** [alcada-comercial.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/alcada-comercial.service.spec.ts).
- **Sanitizador de Custos/Margem:** [sanitizar-custos-orcamento.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/domain/sanitizar-custos-orcamento.ts).
- **DTO de Decisão:** [decidir-alcada.dto.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/dto/decidir-alcada.dto.ts).
- **Endpoints:** `GET /orcamentos-v2/alcadas-pendentes` e `POST /orcamentos-v2/:id/alcada/decidir` em [orcamentos-v2.controller.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/controllers/orcamentos-v2.controller.ts).
- **Frontend Dialog:** [alcadas-pendentes-dialog.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/orcamentos-v2/alcadas-pendentes-dialog.tsx) integrado em [orcamentos-v2/page.tsx](file:///c:/Projects/comunikapp/frontend/src/app/(main)/orcamentos-v2/page.tsx).

---

## 2. Invariantes Mantidas

1. **Desambiguação de Alçadas (D-10):**
   - O serviço de alçada comercial de Vendas (`AlcadaComercialService`) é totalmente desacoplado da alçada orçamentária operacional da OS (`alcadas-orcamento.service.ts`).
2. **Promoção para `aguardando_alcada` via Writer Canônico:**
   - Tentativas de criar ou enviar propostas com desconto excedendo o limite permitido do vendedor promovem o status de `rascunho` para `aguardando_alcada` utilizando exclusivamente o `TransicaoComercialService` com o evento `vendas.alcada.solicitada`.
3. **Decisão Auditada e Justificativa Obrigatória:**
   - A aprovação (`aguardando_alcada -> enviada`) ou rejeição (`aguardando_alcada -> perdida`) exige permissão `vendas.alcada.aprovar` e justificativa registrada na auditoria/timeline.
4. **Proteção RBAC de Custos/Margem (Segurança OWASP):**
   - Vendedores sem permissão `vendas.preco.custo.ver` ou `vendas.preco.margem.ver` têm detalhes internos de composição de custo e margem bruta expurgados (`sanitizarCustosEMargem`).

---

## 3. Resultados das Validações

### 3.1 Testes Unitários de Alçada Comercial
```text
npm test -- backend/src/orcamentos-v2/services/alcada-comercial.service.spec.ts
```
**Resultado:** 7 testes aprovados (100% de sucesso).
- √ 1. desconto dentro do limite (<= 10%) não requer alçada comercial
- √ 2. desconto acima da alçada (15%) por vendedor comum promove rascunho -> aguardando_alcada
- √ 3. usuário com permissão ALCADA_APROVAR aprova desconto elevado sem cair em aguardando_alcada
- √ 4. gestor aprova alçada comercial pendente (aguardando_alcada -> enviada)
- √ 5. gestor rejeita alçada comercial com justificativa (aguardando_alcada -> perdida)
- √ 6. exige justificativa válida para decisão de alçada
- √ 7. expurga custos e margem quando o usuário não possui permissão RBAC de visualização

### 3.2 Compilações de Produção
- **Backend:** `nest build` concluído com sucesso.
- **Frontend:** `next build` concluído com sucesso (37/37 páginas geradas).

---

## 4. Arquivos Criados/Modificados na Fase 7

- `[NEW]` [alcada-comercial.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/alcada-comercial.service.ts)
- `[NEW]` [alcada-comercial.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/alcada-comercial.service.spec.ts)
- `[NEW]` [sanitizar-custos-orcamento.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/domain/sanitizar-custos-orcamento.ts)
- `[NEW]` [decidir-alcada.dto.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/dto/decidir-alcada.dto.ts)
- `[MODIFY]` [orcamentos-v2.controller.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/controllers/orcamentos-v2.controller.ts)
- `[MODIFY]` [orcamentos-v2.module.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/orcamentos-v2.module.ts)
- `[MODIFY]` [vendas-permissoes.ts](file:///c:/Projects/comunikapp/backend/src/vendas/permissions/vendas-permissoes.ts)
- `[NEW]` [alcadas-pendentes-dialog.tsx](file:///c:/Projects/comunikapp/frontend/src/components/ui/orcamentos-v2/alcadas-pendentes-dialog.tsx)
- `[MODIFY]` [orcamentos-v2/page.tsx](file:///c:/Projects/comunikapp/frontend/src/app/(main)/orcamentos-v2/page.tsx)
