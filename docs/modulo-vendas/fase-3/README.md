# Fase 3 — Fundação visual, navegação e compatibilidade de rotas

**Status:** concluída com evidências (`evidencia-fase-3.md`, `evidencia-testes-fase-3.md`)
**HEAD de partida:** `a06a2218`
**Dependência:** Fase 2 concluída
**Fora de escopo:** carteira, pipeline novo, CRUDs novos, Gate 0S, deploy, migration

## Objetivo

Casa `/vendas` com `ModuleLayoutShell` + `vendasModuleNav`, sem reescrever
Orçamentos/Clientes. Backend permanece fonte de verdade (`GET /vendas/acesso`).

## Entregáveis

| Item | Evidência |
|---|---|
| `vendasModuleNav` + registry | `frontend/src/lib/module-nav/vendas.ts`, `registry.ts` |
| `/vendas` + shell | `frontend/src/app/(main)/vendas/` |
| Sidebar Vendas condicional | `sidebar-menu.tsx` + `useVendasAcesso` + `GET /vendas/acesso` |
| Orçamentos/Clientes fora do global | removidos de `buildSidebarNavItems` |
| Aliases `/orcamentos-v2` e `/clientes` | páginas vivas + layouts com nav Vendas filtrada |
| Cards Orçamentos/Clientes/Simulador | hub `/vendas` |
| Aditivos só com `os_aditiva_habilitada` | `useVendasNavFiltrado` + `/vendas/aditivos` |
| Sem Financeiro para VENDAS | `podeVerFinanceiro` só ADMIN/FINANCEIRO |
| Estados loading/vazio/erro/sem permissão | `vendas/page.tsx` |

## Artefatos

- `auditoria-rotas-antigas.md`
- `evidencia-fase-3.md`
- `evidencia-testes-fase-3.md`
