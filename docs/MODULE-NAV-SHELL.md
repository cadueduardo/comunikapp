# Navegação por módulo (Module Nav Shell)

## Objetivo

Troca rápida entre **seções** de um módulo sem voltar à home de cards.
A sidebar esquerda continua listando só **módulos**.

## Componentes

| Peça | Uso |
|------|-----|
| `ModuleNavConfig` | Config em `frontend/src/lib/module-nav/` |
| `MODULE_NAV_REGISTRY` | Índice de todos os módulos |
| `ModuleHeader` | Título + `Seções` (desktop) / título (mobile) |
| `ModuleSubmenu` | Dropdown desktop |
| `ModuleBottomNav` | Rodapé mobile → bottom sheet |
| `ModuleLayoutShell` | Layout do módulo (padding + bottom nav) |
| `ModuleHubCards` | Cards da home a partir da config |

## Regra ≥ 2 itens

`shouldShowModuleSectionNav(nav)` — com menos de 2 itens navegáveis, não mostra `Seções` nem o rodapé. A config ainda existe para o próximo item.

## Como aderir um módulo novo

1. Criar `lib/module-nav/meu-modulo.ts` e registrar em `registry.ts`.
2. `app/(main)/meu-modulo/layout.tsx` com `ModuleLayoutShell`.
3. Home e subpáginas com `ModuleHeader`.
4. Home: `ModuleHubCards` em vez de array local duplicado.

## Piloto de referência

Financeiro: `financeiroModuleNav` + páginas em `app/(main)/financeiro/`.

## Agentes

Seguir a regra Cursor `.cursor/rules/module-nav-shell.mdc` ao tocar em rotas `(main)`.
