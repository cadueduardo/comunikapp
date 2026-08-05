# Evidência MySQL 8 — Fase 5 (M5.5 + seed)

**SHA base:** `7ace2dc6`
**Data:** 2026-08-05
**Engine:** MySQL Community Server **8.4.9**
**Host/porta:** `127.0.0.1:3307`
**Banco:** `comunikapp_ci_scratch` (autorizado: nome contém `ci`/`scratch`)
**Datadir:** `.tmp/mysql8-ci/data`
**Gate 0S / produção / deploy:** não tocados

## 1. Migration `20260805120800_vendas_orcamento_add_contato`

Como `migrate deploy` do zero permanece bloqueado pela dívida
`20251101000100` (mesmo padrão F4/F5), nesta rodada o SQL da migration foi
executado diretamente no scratch e a linha correspondente foi inserida em
`_prisma_migrations`. O code review posterior classificou esse procedimento
como **não canônico**, pois viola a regra de não alterar schema ou histórico fora
do Prisma. O utilitário que fazia essa aplicação foi removido do repositório.

A evidência abaixo continua válida como prova do DDL e do comportamento no
MySQL 8, mas **não equivale a uma execução aprovada de `prisma migrate deploy`**.

**Resultado sanitizado:**

```json
{
  "ok": true,
  "host": "127.0.0.1:3307",
  "banco": "comunikapp_ci_scratch",
  "migration": "20260805120800_vendas_orcamento_add_contato",
  "sql_aplicado_nesta_execucao": true,
  "coluna": [{ "COLUMN_NAME": "contato_id", "IS_NULLABLE": "YES", "COLUMN_TYPE": "varchar(191)" }],
  "indice": [{ "INDEX_NAME": "orcamento_contato_id_idx", "COLUMN_NAME": "contato_id" }],
  "fk": [{
    "CONSTRAINT_NAME": "orcamento_contato_id_fkey",
    "DELETE_RULE": "SET NULL",
    "UPDATE_RULE": "CASCADE",
    "REFERENCED_TABLE_NAME": "cliente_contato"
  }]
}
```

### Drift

```text
npx prisma migrate diff --from-url $env:DATABASE_URL --to-schema-datamodel prisma/schema.prisma --script
```

Saída: `-- This is an empty migration.` → schema e banco ficaram equivalentes
após a aplicação manual. Isso não valida o processo de migration nem elimina a
dívida histórica que impede `migrate deploy`.

## 2. Integração real — orçamento + contato_id

```text
$env:ALLOW_RBAC_TEST_MUTATIONS='true'
npx ts-node --transpile-only scripts/comprovar-m55-orcamento-contato-mysql8.ts
```

Caso de uso: `ValidacaoV2Service` + `TransformacaoV2Service` + `prisma.orcamento.create`
+ releitura no MySQL.

```json
{
  "ok": true,
  "engine": "mysql8_scratch_3307",
  "host": "127.0.0.1:3307",
  "banco": "comunikapp_ci_scratch",
  "versao": "8.4.9",
  "fk_delete_rule": "SET NULL",
  "provas": {
    "contato_persistido_e_relido": true,
    "orcamento_sem_contato": true,
    "nega_contato_outro_cliente": true,
    "nega_contato_outra_loja": true,
    "nega_contato_inativo": true,
    "set_null_ao_deletar_contato": true
  }
}
```

## 3. Seed RBAC duas vezes

```text
$env:ALLOW_RBAC_TEST_MUTATIONS='true'
npx ts-node --transpile-only scripts/seed-vendas-rbac-duas-vezes.ts
```

```json
{
  "primeira": {
    "lojas": 4,
    "perfis_criados": 16,
    "perfis_atualizados": 0,
    "permissoes_upsert": 220,
    "vinculos_criados": 4,
    "pulados": 0,
    "sem_associacao": 0
  },
  "segunda": {
    "lojas": 4,
    "perfis_criados": 0,
    "perfis_atualizados": 16,
    "permissoes_upsert": 220,
    "vinculos_criados": 0,
    "pulados": 4,
    "sem_associacao": 0
  },
  "idempotente": true
}
```

Concessões (Financeiro sem `ATIVIDADE_*`; Vendedor/Gestor com defaults F5):

```text
npx ts-node --transpile-only scripts/comprovar-seed-fase5-concessoes.ts
```

```json
{ "ok": true, "lojas_verificadas": 4 }
```

## 4. Provas CAS outbox (já existentes)

Ver seção anterior / script `proof-outbox-cas-mysql8.ts`.
