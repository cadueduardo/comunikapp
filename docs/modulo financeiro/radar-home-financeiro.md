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
| Pós-cálculo (OS) | `/financeiro/pos-calculo` | Ativo (categorias + pendências de desvio) |
| Relatórios | `/financeiro/relatorios` | Em breve |

## KPIs do panorama (dashboard)

Endpoint: `GET /financeiro/dashboard`

| KPI | Significado |
|---|---|
| A receber | Saldo em aberto de cobranças |
| A pagar | Saldo em aberto de contas a pagar |
| Vencido a receber | Saldo de cobranças VENCIDO |
| Vencido a pagar | Saldo de parcelas vencidas |
| Recebido / Pago no mês | Movimento confirmado do mês UTC |
| Saldo líquido do período | Recebido − pago |
| Pendências críticas | Contagem cobranças + parcelas vencidas |

## Padrão visual compartilhado

Home de **Compras** usa a mesma grade de cards de recurso (sem Contas a pagar — domínio Financeiro).

## Próximos candidatos (não implementar sem RP)

- fluxo de caixa / previsões;
- conciliação (fora do MVP inicial);
- exportações e dashboards de inadimplência.

## Relação com Compras

Contas a pagar **pertence ao domínio Financeiro**; Compras apenas gera/vincula a obrigação a partir do pedido (recebimento/aceite). A home de Compras pode manter atalho, mas a gestão fica em Financeiro.

## Documento relacionado

- `docs/modulo financeiro/feature-financeiro-previsto-real.md`
- `docs/modulo de compras/RP-mvp-compras-suprimentos.md` (Fase 5 — Pós-cálculo)
