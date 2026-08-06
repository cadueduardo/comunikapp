# Evidência — Incremento 6.3 (Expiração Canônica de Propostas)

**Data:** 2026-08-05
**Módulo:** Módulo de Vendas (Fase 6)
**Escopo:** Expiração Canônica de Propostas Comerciais Vencidas

---

## 1. Descrição da Entrega

Implementado o serviço e worker agendado de expiração automática de propostas comerciais no eixo comercial canônico (DV-14):

- **Service:** `ExpiracaoOrcamentosService` (`backend/src/orcamentos-v2/services/expiracao-orcamentos.service.ts`).
- **Job Cron:** `ExpiracaoOrcamentosJob` (`backend/src/orcamentos-v2/jobs/expiracao-orcamentos.job.ts`).
- **Suíte de Testes:** `expiracao-orcamentos.service.spec.ts` (`backend/src/orcamentos-v2/services/expiracao-orcamentos.service.spec.ts`).

---

## 2. Invariantes Mantidas

1. **Writer Único:** Todas as expirações utilizam exclusivamente `TransicaoComercialService.executar` com CAS por `id + loja_id + status_comercial`.
2. **Concorrência e Multi-tenancy:** Tratamento atômico do CAS; se uma proposta for aceita ou modificada concorrentemente, o CAS falha (`false`) e o item é contabilizado em `ignoradosConcorrencia` sem corromper a transação nem os demais itens.
3. **Resiliência:** Falha individual em um registro gera log sanitizado sem abortar os demais itens do lote.
4. **Outbox DV-08:** Notificação enfileirada via `OutboxEmailVendasService` com chave de deduplicação `expiracao:{loja_id}:{orcamento_id}`.
5. **Datas UTC:** Comparação de validade estritamente em UTC (`expira_em <= agora`).

---

## 3. Resultados das Validações

### 3.1 Testes Unitários de Expiração
```text
npm test -- backend/src/orcamentos-v2/services/expiracao-orcamentos.service.spec.ts
```
**Resultado:** 8 testes aprovados (100% de sucesso).
- √ 1. ignora propostas sem expira_em ou ativas não vencidas
- √ 2. ignora proposta futura (não incluída na busca por lte)
- √ 3. expira propostas enviada e em_negociacao vencidas
- √ 4. duas execuções concorrentes geram uma única transição (CAS falha na 2a execução)
- √ 5. garante isolamento entre lojas distintas (multi-tenancy)
- √ 6. lote limitado e paginação sem loop infinito
- √ 7. falha em uma proposta não duplica nem corrompe as demais
- √ 8. aceite simultâneo versus expiração possui um único vencedor

### 3.2 Regressão do Writer Comercial
```text
npm test -- backend/src/orcamentos-v2/services/transicao-comercial.service.spec.ts
```
**Resultado:** 4 testes aprovados (não-regressão verificada).

### 3.3 Compilação da Aplicação
```text
npm run build
```
**Resultado:** `nest build` concluído com sucesso sem erros TypeScript.

---

## 4. Arquivos Modificados/Criados no Incremento

- `[NEW]` [expiracao-orcamentos.service.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/expiracao-orcamentos.service.ts)
- `[NEW]` [expiracao-orcamentos.job.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/jobs/expiracao-orcamentos.job.ts)
- `[NEW]` [expiracao-orcamentos.service.spec.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/services/expiracao-orcamentos.service.spec.ts)
- `[MODIFY]` [orcamentos-v2.module.ts](file:///c:/Projects/comunikapp/backend/src/orcamentos-v2/orcamentos-v2.module.ts)
- `[NEW]` [evidencia-entrega-6-3.md](file:///c:/Projects/comunikapp/docs/modulo-vendas/fase-6/evidencia-entrega-6-3.md)
