# Módulo de Vendas

**Status:** Fase 0 executada — **aguardando decisão do product owner** sobre as 16
questões de `fase-0/02-registro-de-decisoes.md`. Implementação de código **não
iniciada**.

| Documento | Conteúdo |
|-----------|----------|
| [`RP-modulo-vendas.md`](./RP-modulo-vendas.md) | Auditoria do projeto, benchmark, requisitos, jornada UX de vendedor/gestor, carteira, arquitetura de informação, gates, épicos, maturidade e riscos |
| [`PLANO-ACAO-MODULO-VENDAS.md`](./PLANO-ACAO-MODULO-VENDAS.md) | Sequência executável em 15 fases, dependências, premissas, checklists, testes, gates obrigatórios e rastreabilidade com o RP |
| [`fase-0/`](./fase-0/README.md) | Entregáveis da Fase 0: auditoria do código real, registro de decisões, nomenclatura e RBAC, máquina de estados, gates, plano de migrations e rastreabilidade |

## Onde está o estado real do código

O RP §4 descreve a **intenção de produto**. A auditoria em
[`fase-0/01-auditoria-estado-real.md`](./fase-0/01-auditoria-estado-real.md)
descreve **o que existe de fato** e prevalece sempre que houver divergência. Ela
encontrou dez dívidas não previstas, três delas bloqueadoras: não existe
`RolesGuard` (as permissões declaradas não autorizam nada), a máquina de estados de
orçamento está desligada do caminho de escrita, e `cliente` não tem estrutura de
carteira.

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
- Clientes fica dentro de Vendas na navegação, mas continua sendo cadastro mestre da loja; carteira representa responsabilidade comercial, não propriedade do registro.
- Proposta aceita, pedido confirmado, OS e cobrança são marcos distintos; não usar OS como substituto conceitual de pedido.
- Aprovação comercial e aprovação de arte são gates independentes.
- Não considerar o módulo completo apenas com hub + orçamento + aditivo; observar o Mínimo Operacional Seguro e o Núcleo Competitivo do RP.
