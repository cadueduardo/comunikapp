# Evidência — Fase 5

**Data:** 2026-08-05  
**SHA inicial:** `a4a89f5c`  
**SHA final:** (ver HEAD após commit de fechamento)  
**Gate 0S / produção / deploy:** não tocados  

## Entregas

| Área | Evidência |
|---|---|
| M5.1–M5.4 migrations | pastas `20260805120400` … `20700` |
| RBAC `DEFAULTS_FASE_5` + seed 2× | `seed-vendas-rbac.spec.ts` |
| Atividades + conclusão CAS | `atividades.service.spec.ts` |
| Notificações endereçadas + URL allowlist | `notificacoes.service.spec.ts` |
| Outbox DV-08 (CAS, descartado, DLQ, hash) | `outbox-email-vendas.*.spec.ts` |
| Atendimento idempotente + deep-link 37 | `atendimento.service.spec.ts` |
| Home KPI `aceito_em` + escopo | `vendas-home.service.spec.ts` |
| Timezone canônico | `vendas-timezone.spec.ts` |
| Nav frontend | `npm run test:vendas-nav` |
| MySQL 8 scratch | `evidencia-mysql-m5.md` |

## Estratégia de orçamento

Fallback seguro: prospect + atividade + idempotência atômicos; deep-link
`/orcamentos-v2/novo?clienteId=&contatoId=` (sem Prisma de orçamento no Atendimento).

## Gate RP 8.9

| Critério | Status |
|---|---|
| (35) Home prioriza o dia | OK — `GET /vendas/home` + UI |
| (36) Atendimento sem cadastro completo | OK — prospect |
| (37) CTA Novo orçamento / deep-link | OK — ficha + atendimento + testes |

## Checklist plano §9

Ver `PLANO-ACAO-MODULO-VENDAS.md` §9 — FASE 5 CONCLUÍDA marcada somente com esta evidência.

## Diferidos (documentados)

Anexos, consentimento de contato externo, WhatsApp, Fase 6, `migrate deploy` do zero
(dívida `20251101000100`, igual F4), drift legado `produtoorcamento` FKs.
