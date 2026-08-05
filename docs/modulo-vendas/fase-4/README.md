# Fase 4 — Clientes, carteira e contatos

**Status:** gate fechado nesta entrega (participantes + legado + MySQL 8)
**HEAD inicial (code review):** `7657ec34548291c0d0e425e799fea9cb2a28d1b3`
**Dependência:** Fases 2 e 3
**Fora de escopo:** mesclagem completa, ficha 360º com atividades (Fase 5), Gate 0S, deploy/produção

## Migrations (ordem)

1. `20260805120000_vendas_add_responsavel_comercial_cliente` (M4.1)
2. `20260805120100_vendas_add_participantes_e_transferencia_carteira` (M4.2)
3. `20260805120200_vendas_add_contatos_cliente_e_deduplicacao` (M4.3)
4. `20260805120300_vendas_scope_idempotencia_transferencia` (M4.4)

## Entregas do fechamento do gate

- gestão autorizada de participantes (API + ficha);
- plano/dry-run de clientes legados sem responsável;
- evidência MySQL 8.4.9 em `comunikapp_ci_scratch:3307`.

## Autorização / escopo

- Identidade só do JWT (`IdentidadeAutenticada`).
- `VendasPermissionsService` + `@RequerPermissaoVendas` no controller; escopo por registro no service.
- Escopos: `propria` | `equipe` | `todos` | `sem_responsavel` (default `propria`).
- Equipe = usuários `VENDAS` ativos da mesma loja (sem hierarquia no schema).
- `cliente.responsavel` = contato interno; `responsavel_comercial_id` = vendedor.
- Participantes: admin via `CARTEIRA_TRANSFERIR`; leitura via escopos de carteira.

## Compatibilidade legado

- `GET /clientes?legado=1` retorna array (selects de orçamento) **sem** furar escopo.
- Campos escalares de contato preservados.
- Soft inativar no `DELETE` (não hard delete).
- Dual-read documentado; sem dual-write de responsável comercial no update genérico.
- Rollout: `rollout-clientes-legados.md`.

Ver `evidencia-fase-4.md`, `evidencia-mysql-m4.md` e `evidencia-testes-fase-4.md`.
