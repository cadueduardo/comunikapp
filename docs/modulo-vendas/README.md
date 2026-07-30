# Módulo de Vendas

**Status:** RP de produto — implementação **não iniciada**.

| Documento | Conteúdo |
|-----------|----------|
| [`RP-modulo-vendas.md`](./RP-modulo-vendas.md) | Requisitos, inventário de reaproveitamento, IA de telas, épicos, MVP e riscos |

## Decisão de fronteira (resumo)

| Domínio | Cuida de |
|---------|----------|
| **Vendas** | Preço ao cliente, proposta, negociação, aditivos comerciais, precificação de ocorrência → caminho comercial |
| **Financeiro** | Cobrar, conciliar, fechar, pós-cálculo (previsto × real) |
| **OS / PCP / campo** | Fatos operacionais **sem R$** na superfície do vendedor de equipe |

## Guardrails

- **Não recriar OS Aditiva** — já existe e está correta; Vendas só referencia e encaixa no fluxo.
- **Não alterar agora** custos / valores / pós-cálculo / aba Financeiro na OS — o RP absorve essas melhorias de fronteira para implementação futura.
- Orçamentos (`orcamentos-v2`), clientes e chat de negociação são ativos a **absorver**, não duplicar.
