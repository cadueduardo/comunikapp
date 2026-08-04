# Auditoria — consumidores das rotas `/orcamentos-v2` e `/clientes`

**Data:** 2026-08-04
**Decisão Fase 3:** rotas **permanecem vivas** como aliases (bookmarks e links
internos). A sidebar deixa de listá-las como módulos globais; a casa passa a
ser `/vendas`.

## Consumidores relevantes (frontend)

### Navegação / deep links de UI

- `components/ui/cliente-card.tsx` — links para clientes e orçamentos
- `components/clientes/cliente-ficha.tsx`
- `app/(main)/clientes/columns.tsx`, `novo`, `editar`
- `components/ui/orcamentos-v2/*` (tabela, cards, form)
- `hooks/use-duplicar-orcamento.ts`
- `components/home-operacional/ResumoFinanceiroSimples.tsx`
- `components/ui/notificacoes-dropdown.tsx`, `chat-flutuante.tsx`
- `hooks/use-websocket.ts`

### API / assets

- `app/api/orcamentos-v2/**` (público, reenviar-código)
- `lib/api-client.ts`, `lib/anexo-geometria-client.ts`

### Module nav

- `lib/module-nav/operacionais.ts` — configs legadas mantidas no registry
- `lib/module-nav/vendas.ts` — aponta cards para os mesmos hrefs

## Impacto da mudança de sidebar

| Antes | Depois |
|---|---|
| Sidebar: Orçamentos → `/orcamentos-v2` | Sidebar: Vendas → `/vendas` |
| Sidebar: Clientes → `/clientes` | Absorvido em Vendas |
| Bookmark `/orcamentos-v2` | Continua abrindo a listagem |
| Bookmark `/clientes` | Continua abrindo o cadastro |
| Ordem salva com `orcamentos`/`clientes` | Migrada para `vendas` via `migrateSidebarOrderIds` |

## Risco residual

Links externos/bookmarks que apontavam para a **entrada de menu** “Orçamentos”
passam a usar o hub `/vendas`; URLs profundas não quebram.
