# Evidência MySQL 8 — Fase 5

**Host:** `127.0.0.1:3307`  
**Banco:** `comunikapp_ci_scratch`  
**Método:** `npx prisma db push --accept-data-loss --skip-generate` (mesmo padrão F4; `migrate deploy` do zero permanece bloqueado pela dívida pré-existente `20251101000100`).

## Resultado

- Schema Prisma sincronizado no scratch (inclui `atividade_comercial`, colunas M5.2 em `notificacao`, `atendimento_idempotencia`, `outbox_email_vendas`).
- `prisma migrate diff` ainda lista FKs legadas de `produtoorcamento`/`versaoorcamento` (dívida pré-F5, não introduzida nesta fase).
- Script `backend/scripts/proof-outbox-cas-mysql8.ts`: disputa CAS de duas atualizações na mesma linha outbox (um vencedor).

Saída observada:

```json
{"ok":true,"c1":0,"c2":1,"id":"cmsgho0df0001w43gmo780vpk","engine":"mysql8_scratch_3307"}
```

## Não feito neste host

- `migrate deploy` completo do zero (bloqueio conhecido).
- Seed 2× em produção.
- Suíte E2E personas completa do gate (parcialmente coberta por unitários).
