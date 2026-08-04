# Evidência — Fase 3 (fundação visual e navegação)

**Data:** 2026-08-04
**HEAD inicial:** `a06a22181838e8076d6d37a5c08c46241e3394c4`
**HEAD final:** `fbb76595fe9b9acbeca0d36aa24a3e7a395bc4ab`
**Gate 0S:** congelado (não reaberto)
**Produção / migration / deploy:** não executados

## Decisões

1. **Aliases vivos:** `/orcamentos-v2` e `/clientes` **não** redirecionam para
   outra URL; permanecem bookmarks com shell `vendasModuleNav`.
2. **Gate de UI do módulo:** `proposta.ver` via `GET /vendas/acesso`
   (`VendasPermissionsService`). Sidebar e hub negam por padrão em loading/erro.
3. **Aditivos:** card/nav filtrados por `os_aditiva_habilitada` (API instalação);
   página `/vendas/aditivos` reutiliza `InstalacaoOcorrenciasFilaGrid`.
4. **Financeiro na sidebar:** apenas `ADMINISTRADOR` | `FINANCEIRO` (função do
   usuário autenticado no contexto; VENDAS não entra).
5. **CRUDs:** não reescritos nesta fase.

## Checklist de execução (§7 plano)

| Item | Evidência verificável |
|---|---|
| `vendasModuleNav` | `frontend/src/lib/module-nav/vendas.ts` |
| Registry | `MODULE_NAV_REGISTRY` em `registry.ts` inclui `vendas` |
| `/vendas` + `ModuleLayoutShell` | `app/(main)/vendas/layout.tsx` + `page.tsx` |
| Sidebar Vendas por permissão | `(main)/layout.tsx` → `useVendasAcesso` → `podeVerVendas` |
| Orçamentos/Clientes fora do global | `buildSidebarNavItems` sem esses ids; só `vendas` |
| Aliases seguros | layouts de `orcamentos-v2` e `clientes` usam nav Vendas |
| Bookmarks/links | auditoria em `auditoria-rotas-antigas.md` |
| Cards Orçamentos/Clientes/Simulador | hub + `getModuleHubCardItems` |
| Aditivos só se config permitir | `filtrarVendasNavPorConfig` / `useVendasNavFiltrado` |
| Sem Financeiro para VENDAS | `podeVerFinanceiro` só ADMIN/FINANCEIRO |
| Estados loading/vazio/erro/sem permissão | `vendas/page.tsx` |
| dark/light, teclado, mobile/desktop | tokens `bg-card`/`text-muted-*`; cards + ModuleHeader/BottomNav existentes |

## Gate de conclusão

| Critério | Evidência |
|---|---|
| Nav para vendedor / gestor / sem acesso / isolamento | Jest `vendas-acesso.controller.spec.ts` + `npm run test:vendas-nav` |
| Rotas antigas compatíveis | aliases vivos + auditoria |
| Sem mock | hub só consome `/vendas/acesso` e config instalação |
| RP 8.1 | itens 1–3 cobertos por sidebar + hub + filtro financeiro |
| RP 8.2 | fluxos de orçamento **não alterados** nesta fase (regressão zero por escopo) |
| RP 8.3 | superfície `/vendas/aditivos` reusa fila/dialog existentes; gerador não duplicado |

## Testes executados

Ver saída em `evidencia-testes-fase-3.md` (preenchida após a bateria).

## Itens diferidos (fora do escopo F3)

- Carteira (`/vendas/carteira`), pipeline comercial, KPIs do hub
- Reescrita de CRUDs Clientes/Orçamentos
- Redirect HTTP 301/302 (mantidos aliases vivos por decisão)
- Gate 0S / deploy / migration

## Riscos / ressalvas

- Flash breve da sidebar até `/vendas/acesso` (deny-by-default).
- Config de aditivos indisponível → Aditivos ocultos (fail-closed).
- Validação visual a11y/dark-light depende de inspeção manual no browser local.
