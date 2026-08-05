# EvidÃªncia â€” Fase 5

**Data:** 2026-08-05
**SHA inicial desta continuidade:** `a29c46fc`
**Status do gate:** Em validaÃ§Ã£o (nÃ£o concluÃ­da)
**Gate 0S / produÃ§Ã£o / deploy:** nÃ£o tocados

## Entregas desta continuidade

| Ãrea | EvidÃªncia |
|---|---|
| UI atendimento: cliente existente + prospect | `frontend/.../vendas/atendimento/page.tsx` |
| CritÃ©rio 37: `orcamento.contato_id` | migration `20260805120800_vendas_orcamento_add_contato` |
| ValidaÃ§Ã£o loja/cliente/contato | `validacao-v2.service.ts` + specs |
| Deep-link consumido no Novo orÃ§amento | `orcamentos-v2/novo/page.tsx` + form V2 |
| PersistÃªncia no create canÃ´nico | `transformacao-v2.service.ts` (`contato_id`) |

## Gate RP 8.9

| CritÃ©rio | Status |
|---|---|
| (35) Home prioriza o dia | OK â€” `GET /vendas/home` + UI |
| (36) Atendimento sem cadastro completo + cliente existente | OK â€” UI busca carteira; prospect opcional; `CLIENTE_CRIAR` sÃ³ no prospect |
| (37) CTA / deep-link com contato persistido | OK nos testes de fluxo (URL â†’ payload â†’ validaÃ§Ã£o); ver `fluxo-atendimento-orcamento-contato.spec.ts` |

## Checklist plano Â§9

Ver `PLANO-ACAO-MODULO-VENDAS.md` Â§9 â€” **FASE 5 permanece Em validaÃ§Ã£o** atÃ© o gate final ser marcado com evidÃªncia reproduzÃ­vel completa (incluindo seed 2Ã— e suites abaixo verdes nesta mÃ¡quina).

## Diferidos (documentados)

Anexos, consentimento de contato externo, WhatsApp, Fase 6, `migrate deploy` do zero
(dÃ­vida `20251101000100`, igual F4), drift legado `produtoorcamento` FKs.
