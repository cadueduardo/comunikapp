# Evidência de testes — Fase 4

**Implementação auditada:** `e5992b04bffe46d0a05a5607d3bbb28ad542773d`
**HEAD inicial:** `b1c59dd6`

## Jest (backend)

```text
npx jest src/clientes/clientes-carteira.service.spec.ts \
  src/clientes/clientes.controller.spec.ts \
  src/vendas/vendas-acesso.controller.spec.ts \
  --runInBand --forceExit --no-coverage
```

**Resultado após code review:** 3 suites, **56 passed**.

Cobertura relevante da suite de carteira:

- vendedor vê própria carteira / 404 fora do escopo
- gestor equipe / admin todos / sem responsável
- transferência idempotente por tenant, cross-loja negada, usuário inativo e
  usuário operacional negados
- compare-and-set recusa sobrescrita concorrente sem criar histórico
- opções de responsável limitadas à mesma loja e às funções comerciais elegíveis
- histórico na mesma transação
- paginação/busca
- contatos isolados por loja

## Frontend

```text
npm run test:vendas-nav
```

**Resultado:** ok, inclui `carteira_nav_e_template_crud` (default table, grid padrão, `enablePagination={false}`).

## Build / validate

- `npx prisma validate` — ok
- `npx nest build` — ok (exit 0)
- `git diff --check` — ver commit

## Ressalvas

- Typecheck frontend completo continua com erros pré-existentes alheios; arquivos F4 validados via script de contratos + lints pontuais.
- Inspeção visual a11y/dark-light residual no browser.
