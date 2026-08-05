# Evidência MySQL 8 — Fase 5

**Host:** `127.0.0.1:3307`  
**Banco:** `comunikapp_ci_scratch`  
**Método schema:** `npx prisma db push --accept-data-loss --skip-generate`  
(`migrate deploy` do zero permanece bloqueado pela dívida pré-existente `20251101000100`, mesmo padrão da Fase 4.)

## Provas CAS outbox

Script: `backend/scripts/proof-outbox-cas-mysql8.ts`

```json
{"ok":true,"uma_linha":{"c1":1,"c2":0,"ok":true},"lote":{"adquiridos":3,"esperado":3,"ok":true},"worker_antigo_bloqueado":true,"engine":"mysql8_scratch_3307"}
```

Interpretação:

- Duas instâncias em **uma** linha → exatamente um claim (`count=1`).
- Lote de 3 linhas com claims paralelos → 3 adquiridos no total (sem double-send).
- Worker antigo com `bloqueado_por` divergente **não** finaliza (`count=0`).

## Drift

`prisma migrate diff` ainda lista FKs legadas de `produtoorcamento`/`versaoorcamento`
(pré-F5). Tabelas M5 entraram via schema sync no scratch.

## Não executado

- Deploy / produção
- `migrate deploy` completo do zero
