# Radar — Home e expansão do módulo Financeiro

**Status:** ativo  
**Atualizado:** 2026-07-21  
**Contexto:** o menu lateral não deve apontar para um único subfluxo; a home agrega os recursos.

## Decisão

A home `/financeiro` segue o mesmo padrão de navegação por **cards de recurso** da home de Estoque (`/estoque`). Cada novo recurso financeiro entra como card na grade (e rota própria), sem substituir o item único do sidebar.

## Já na home

| Card | Rota | Situação |
|---|---|---|
| Contas a receber | `/financeiro/recebimentos` | Ativo (cobranças de cliente) |
| Contas a pagar | `/financeiro/contas-pagar` | Ativo (MVP Compras Fase 4) |
| Pós-cálculo (OS) | `/financeiro/pos-calculo` | Ativo (fundação read-only Fase 5) |
| Relatórios | `/financeiro/relatorios` | Em breve |

## Próximos candidatos (não implementar sem RP)

- fluxo de caixa / previsões;
- conciliação (fora do MVP inicial);
- exportações e dashboards de inadimplência.

## Relação com Compras

Contas a pagar **pertence ao domínio Financeiro**; Compras apenas gera/vincula a obrigação a partir do pedido (recebimento/aceite). A home de Compras pode manter atalho, mas a gestão fica em Financeiro.

## Documento relacionado

- `docs/modulo financeiro/feature-financeiro-previsto-real.md`
- `docs/modulo de compras/RP-mvp-compras-suprimentos.md` (Fase 5 — Pós-cálculo)
