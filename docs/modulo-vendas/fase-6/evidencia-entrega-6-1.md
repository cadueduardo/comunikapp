# Evidência — Fase 6.1

## Verificações

```text
npx jest src/orcamentos-v2/domain/maquina-status-comercial.spec.ts \
  src/orcamentos-v2/domain/status-comercial.spec.ts --runInBand --no-coverage
```

Resultado: 2 suítes e 30 testes aprovados.

```text
npx nest build
```

Resultado: compilação aprovada com heap ampliado.

```text
npx jest --runTestsByPath \
  src/orcamentos-v2/services/orcamentos-v2-aceite-publico.spec.ts \
  --runInBand --no-coverage
```

Resultado: 29 testes aprovados, incluindo aceite público/interno, concorrência,
rollback do handoff, auditoria e revogação no cancelamento. O contrato legado de
auditoria `STATUS_ALTERADO` foi preservado; a timeline nova registra o estado
comercial canônico.
