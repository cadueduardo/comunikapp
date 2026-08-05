# Fase 5 — Home acionável, atendimento e atividades

**Status:** em implementação / gate em validação  
**SHA inicial:** `a4a89f5c`  
**Contrato:** plano `fase_5_vendas_home_e8800926.plan.md`

## Escopo entregue

- `atividade_comercial` (M5.1)
- `notificacao` endereçada (M5.2) + `chave_dedup`
- `atendimento_idempotencia`
- `outbox_email_vendas` + worker CAS (DV-08)
- Home tipada `GET /vendas/home`
- Atendimento idempotente com deep-link canônico de orçamento
- Frontend: home, atividades (template CRUD), atendimento, CTA ficha

## Estratégia de orçamento

Fallback seguro: prospect + atividade + idempotência na mesma tx; deep-link
`/orcamentos-v2/novo?clienteId=…&contatoId=…` para o fluxo canônico. Sem Prisma
direto de orçamento no Atendimento.

## Migrations

1. `20260805120400_vendas_add_atividade_comercial`
2. `20260805120500_notificacao_add_destinatario`
3. `20260805120600_vendas_add_atendimento_idempotencia`
4. `20260805120700_vendas_add_outbox_email`

## Fora de escopo

Fase 6, WhatsApp, e-mail ao cliente, anexos, reabertura, Gate 0S produção.
