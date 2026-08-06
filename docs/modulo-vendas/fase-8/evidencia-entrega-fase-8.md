# Evidência — Fase 8 (Aceite, Pedido Confirmado, Gates e Handoffs)

**Data:** 2026-08-06
**Módulo:** Módulo de Vendas (Fase 8)
**Escopo:** Transação Atômica de Aceite, Evidências Auditáveis, Gerador CSPRNG e Handoffs Idempotentes (Financeiro e Operação)

---

## 1. Descrição da Entrega

Implementada a infraestrutura de aceite transacional e handoffs de vendas (DV-01 / DV-03 / DV-06):

- **Gerador CSPRNG Seguro:** [gerador-token-seguro.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/domain/gerador-token-seguro.ts) utilizando `crypto.randomBytes` e `randomInt` para evitar o uso de `Math.random()`.
- **DTO de Aceite:** [registrar-aceite.dto.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/dto/registrar-aceite.dto.ts) com `class-validator` e Swagger.
- **Serviço de Handoff Atômico:** [processar-aceite-handoff.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/processar-aceite-handoff.service.ts).
- **Suíte de Testes:** [processar-aceite-handoff.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/processar-aceite-handoff.service.spec.ts).
- **Endpoint:** `POST /orcamentos-v2/:id/aceite` em [orcamentos-v2.controller.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/controllers/orcamentos-v2.controller.ts).

---

## 2. Invariantes Mantidas

1. **Idempotência Transacional e Proteção Contra Clique Duplo (D-08):**
   - Transição comercial `aceita` -> `pedido_confirmado` orquestrada via `TransicaoComercialService`.
   - Se a proposta já estiver no status `pedido_confirmado` ou `aceita`, a chamada retorna o resultado com sucesso e `jaProcessado: true`, impedindo a duplicidade de cobranças ou Ordens de Serviço.
2. **Registro Auditável de Evidências:**
   - Gravamento confiável de IP e User-Agent via `extrairContextoDaRequisicao(req)`, além de `cliente_nome`, `cliente_email`, `cpf_cnpj` e `data_aprovacao`.
3. **Validação de Expiração e Versão Enviada:**
   - Bloqueio imediato do aceite caso a proposta esteja expirada (`expira_em < agora`) ou se a versão enviada não for a versão vigente.
4. **Isolamento Multi-Tenant Garantido:**
   - Filtro compulsório por `id` e `loja_id` em todas as consultas e mutações.

---

## 3. Resultados das Validações

### 3.1 Testes Unitários de Handoff
```text
npm test -- backend/src/orcamentos-v2/services/processar-aceite-handoff.service.spec.ts
```
**Resultado:** 4 testes aprovados (100% de sucesso).
- √ 1. registra aceite com evidências auditáveis e aciona handoffs transacionais
- √ 2. nega aceite em proposta expirada com mensagem clara
- √ 3. requisições duplicadas retornam resultado idempotente sem duplicar efeitos
- √ 4. impede acesso ou aceite a orçamento pertencente a outro tenant (IDOR)

### 3.2 Compilações de Produção
- **Backend:** `nest build` concluído com sucesso.
- **Frontend:** `next build` concluído com sucesso (37/37 páginas geradas).

---

## 4. Arquivos Criados/Modificados na Fase 8

- `[NEW]` [gerador-token-seguro.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/domain/gerador-token-seguro.ts)
- `[NEW]` [registrar-aceite.dto.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/dto/registrar-aceite.dto.ts)
- `[NEW]` [processar-aceite-handoff.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/processar-aceite-handoff.service.ts)
- `[NEW]` [processar-aceite-handoff.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/processar-aceite-handoff.service.spec.ts)
- `[MODIFY]` [orcamentos-v2.controller.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/controllers/orcamentos-v2.controller.ts)
- `[MODIFY]` [orcamentos-v2.module.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/orcamentos-v2.module.ts)
