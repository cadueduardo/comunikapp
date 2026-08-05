# Evidência — Fase 5 (parcial / em progresso)

## SHA

- Inicial: `a4a89f5c`
- Final: (preencher no commit de fechamento)

## Testes unitários executados

```text
npx jest src/vendas/timezone/vendas-timezone.spec.ts \
  src/vendas/outbox/outbox-email-vendas.job.spec.ts \
  src/vendas/permissions/seed-vendas-rbac.spec.ts \
  --runInBand --forceExit --no-coverage
```

Resultado: **13 passed** (2026-08-05).

Inclui:

- timezone canônico `America/Sao_Paulo` mesmo com `TZ=UTC`
- outbox lote + claim por id + worker antigo sem ownership
- seed RBAC

```text
npx jest src/vendas/atividades/atividades.service.spec.ts --runInBand --forceExit --no-coverage
```

(ver saída do run local)

## Outbox / DV-08

Implementação:

- select limitado N=20 ordenado
- CAS individual por `id`
- sucesso/falha com `bloqueado_por`
- estados: pendente, processando, enviado, descartado, dead_letter
- eventos: ATIVIDADE_ATRIBUIDA, ATIVIDADE_REPROGRAMADA, ATIVIDADE_VENCENDO
- sem e-mail na conclusão

## Orçamento

Deep-link canônico (sem create Prisma no atendimento).

## Produção / Gate 0S

Não tocados.
