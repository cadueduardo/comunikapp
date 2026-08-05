# Evidência de testes — Fase 4

**HEAD inicial (code review):** `7657ec34548291c0d0e425e799fea9cb2a28d1b3`

## Jest (backend)

```text
npx jest src/clientes/clientes-carteira.service.spec.ts \
  src/clientes/clientes.controller.spec.ts \
  --runInBand --forceExit --no-coverage
```

**Resultado (fechamento do gate):** suite carteira **51 passed**; controller com
delegação de participantes.

Cobertura relevante:

- vendedor vê própria carteira / 404 fora do escopo
- gestor equipe / admin todos / sem responsável
- transferência idempotente por tenant, cross-loja negada, usuário inativo e
  usuário operacional negados
- compare-and-set: dois gestores com chaves diferentes → 1 sucesso + 1 conflito
- mesma chave concorrente → retry idempotente
- mesma chave em lojas diferentes → permitido
- responsáveis disponíveis sem operacionais/outra loja
- participantes: visualizar, sem transferir/inativar, inclusão idempotente,
  remoção cross-tenant 404, não duplicar responsável
- legado sem responsável fora da carteira própria
- alerta de duplicidade só com `{ campo }`
- contatos isolados por loja

## Frontend

```text
npm run test:vendas-nav
```

Inclui contratos de `/vendas/carteira` (default table, cards mobile,
`enablePagination={false}`).

## MySQL 8

Ver `evidencia-mysql-m4.md` — provas CAS, unicidade por tenant, rollback, sem drift.

## Build / validate

- `npx prisma validate` — ok
- `prisma migrate diff` (scratch MySQL 8) — sem diferença
- `npx nest build` — ver entrega
- `git diff --check` — ver commit

## Ressalvas / diferidos

- Redistribuição automática ao inativar vendedor
- Ficha 360 completa (atividades/pedidos/aditivos) → Fase 5+
- Mesclagem administrativa → Fase 13
- Cadeia `migrate deploy` do zero ainda bloqueada pela dívida
  `20251101000100` (fora do escopo F4)
