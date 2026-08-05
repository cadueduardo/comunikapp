# Fase 4 — Clientes, carteira e contatos

**Status:** em fechamento com evidências
**HEAD final:** '+sha+\
**HEAD inicial:** `b1c59dd6dfe099023915e61b69ded682d023cf7d`
**Dependência:** Fases 2 e 3
**Fora de escopo:** mesclagem completa, ficha 360º com atividades (Fase 5), Gate 0S, deploy/produção

## Migrations (ordem)

1. `20260805120000_vendas_add_responsavel_comercial_cliente` (M4.1)
2. `20260805120100_vendas_add_participantes_e_transferencia_carteira` (M4.2)
3. `20260805120200_vendas_add_contatos_cliente_e_deduplicacao` (M4.3)

## Autorização / escopo

- Identidade só do JWT (`IdentidadeAutenticada`).
- `VendasPermissionsService` + `@RequerPermissaoVendas` no controller; escopo por registro no service.
- Escopos: `propria` | `equipe` | `todos` | `sem_responsavel` (default `propria`).
- Equipe = usuários `VENDAS` ativos da mesma loja (sem hierarquia no schema).
- `cliente.responsavel` = contato interno; `responsavel_comercial_id` = vendedor.

## Compatibilidade legado

- `GET /clientes?legado=1` retorna array (selects de orçamento).
- Campos escalares de contato preservados.
- Soft inativar no `DELETE` (não hard delete).
- Dual-read documentado; sem dual-write de responsável comercial no update genérico.

Ver `evidencia-fase-4.md` e `evidencia-mysql-m4.md`.
