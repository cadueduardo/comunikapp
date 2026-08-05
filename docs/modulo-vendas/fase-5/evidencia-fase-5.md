# Evidência — Fase 5

**Data:** 2026-08-05
**SHA inicial desta continuidade:** `a29c46fc`
**SHA final desta continuidade:** `e7f1c220`
**Status do gate:** Em validação (não concluída)
**Gate 0S / produção / deploy:** não tocados

## Entregas desta continuidade

| Área | Evidência |
|---|---|
| UI atendimento: cliente existente + prospect | `frontend/.../vendas/atendimento/page.tsx` |
| Critério 37: `orcamento.contato_id` | migration `20260805120800_vendas_orcamento_add_contato` |
| Validação loja/cliente/contato | `validacao-v2.service.ts` + specs |
| Deep-link consumido no Novo orçamento | `orcamentos-v2/novo/page.tsx` + form V2 |
| Persistência no create canônico | `transformacao-v2.service.ts` (`contato_id`) |

## Gate RP 8.9

| Critério | Status |
|---|---|
| (35) Home prioriza o dia | OK — `GET /vendas/home` + UI |
| (36) Atendimento sem cadastro completo + cliente existente | OK — UI busca carteira; prospect opcional; `CLIENTE_CRIAR` só no prospect |
| (37) CTA / deep-link com contato | Implementado e coberto com mocks (URL → payload → validação); persistência real aguarda M5.5 no MySQL de teste |

## Checklist plano §9

Ver `PLANO-ACAO-MODULO-VENDAS.md` §9 — **FASE 5 permanece Em validação** até o gate final ser marcado com evidência reproduzível completa, incluindo seed duas vezes e criação/leitura de orçamento com contato no MySQL previsto.

## Diferidos (documentados)

Anexos, consentimento de contato externo, WhatsApp, Fase 6, `migrate deploy` do zero
(dívida `20251101000100`, igual F4), drift legado `produtoorcamento` FKs.
