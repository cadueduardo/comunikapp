# Evidência de testes — Fase 5

## Backend

```text
npx jest src/vendas/outbox src/vendas/atendimento src/vendas/home \
  src/vendas/atividades src/vendas/timezone \
  src/vendas/permissions/seed-vendas-rbac.spec.ts \
  src/notificacoes/notificacoes.service.spec.ts \
  --runInBand --forceExit --no-coverage
```

Cobertura:

- Outbox: lote 20, CAS, worker antigo, lock expirado, descartado, e-mail alterado, dead_letter, ator=destinatário, vencendo
- Atendimento: idempotência, 409 payload, deep-link critério 37
- Home: KPI `aceito_em`, escopo vendedor
- Atividades: conclusão idempotente, escopo equipe
- Seed 2× + `ATIVIDADE_*` no vendedor; Financeiro sem atividade
- Notificações: URL inválida, dedup, legado broadcast
- Timezone: constante SP vs `TZ=UTC`

## Frontend

```text
npm run test:vendas-nav
```

Resultado: `ok: true` com `atividades_e_atendimento_nav` e `home_acionavel_sem_hub_cards`.
