# Evidência — Fase 5

**Data:** 2026-08-05
**SHA inicial da rodada MySQL:** `7ace2dc6`
**Status do gate:** Em validação (não concluída)
**Gate 0S / produção / deploy:** não tocados

## Entregas comprovadas nesta rodada

| Área | Evidência |
|---|---|
| DDL de M5.5 no MySQL 8 scratch | `evidencia-mysql-m5.md` — comportamento comprovado; aplicação não canônica |
| Equivalência pós-DDL | empty diff; não substitui `migrate deploy` |
| Persistência real `contato_id` | `comprovar-m55-orcamento-contato-mysql8.ts` |
| Seed 2× + concessões | `seed-vendas-rbac-duas-vezes.ts` + `comprovar-seed-fase5-concessoes.ts` |

## Gate RP 8.9

| Critério | Status |
|---|---|
| (35) Home prioriza o dia | OK (entregas anteriores) |
| (36) Atendimento cliente existente + prospect | Implementado; jornada browser manual pendente |
| (37) Contato no orçamento | OK no MySQL scratch (create+releitura+SET NULL) |

## Checklist plano §9

Ver `PLANO-ACAO-MODULO-VENDAS.md` §9 — **FASE 5 permanece Em validação** até a
jornada manual no navegador e a aplicação canônica da migration serem comprovadas.

## Diferidos

Anexos, consentimento externo, WhatsApp, Fase 6, `migrate deploy` do zero
(dívida `20251101000100`).
