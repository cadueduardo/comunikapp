# 01 — Status Oficiais (Orçamento V2, OS, Cobrança)

**Status do documento:** proposto

## Objetivo

Padronizar os status usados pela Home e pelo motor de transições. A Home apenas **lê** estes status; quem os altera é cada módulo de origem (Orçamentos V2, OS, Financeiro).

## 1. Status de Orçamento V2

### Enum oficial

Fonte de verdade: `backend/src/orcamentos-v2/enums/orcamento-status.enum.ts`

```ts
export enum OrcamentoStatus {
  RASCUNHO = 'rascunho',
  EM_ANALISE = 'em_analise',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  EM_EXECUCAO = 'em_execucao',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}
```

### Labels visíveis (pt-BR)

| status | label curto | label longo |
| --- | --- | --- |
| `rascunho` | Rascunho | Em rascunho, ainda não enviado |
| `em_analise` | Em análise | Enviado ao cliente, em negociação |
| `aprovado` | Aprovado | Aprovado pelo cliente |
| `rejeitado` | Rejeitado | Rejeitado pelo cliente |
| `em_execucao` | Em execução | OS criada e em produção |
| `concluido` | Concluído | Entregue ao cliente |
| `cancelado` | Cancelado | Cancelado pelo vendedor |

### Transições válidas (já implementadas em `validacao-v2.service.ts`)

```text
rascunho      → em_analise | cancelado
em_analise    → aprovado | rejeitado | rascunho | cancelado
aprovado      → em_execucao | cancelado
rejeitado     → rascunho | em_analise
em_execucao   → concluido | cancelado
concluido     → (terminal)
cancelado     → rascunho
```

### Eventos que cada transição dispara

| transição | evento de domínio | consumidor |
| --- | --- | --- |
| `rascunho → em_analise` | `OrcamentoEnviadoCliente` | notificações, link público |
| `em_analise → aprovado` | `OrcamentoAprovado` | OS, financeiro mínimo, Home |
| `em_analise → rejeitado` | `OrcamentoRejeitado` | Home (alertas), notificações |
| `aprovado → em_execucao` | `OrcamentoEmExecucao` | PCP, estoque (reserva) |
| `em_execucao → concluido` | `OrcamentoConcluido` | financeiro (saldo cobrável), Home |
| `* → cancelado` | `OrcamentoCancelado` | estoque (libera reserva), financeiro |

## 2. Status de Ordem de Serviço (OS)

### Status principal (`status` em `ordens_servico`)

Fonte de verdade: enum `StatusOS` em `backend/prisma/schema.prisma`.

```text
FILA
AGUARDANDO_MATERIAL
PRODUCAO
ACABAMENTO
PAUSADA
FINALIZADA
CANCELADA
```

### Labels visíveis (pt-BR)

| status | label curto |
| --- | --- |
| `FILA` | Em fila |
| `AGUARDANDO_MATERIAL` | Aguardando material |
| `PRODUCAO` | Em produção |
| `ACABAMENTO` | Em acabamento |
| `PAUSADA` | Pausada |
| `FINALIZADA` | Finalizada |
| `CANCELADA` | Cancelada |

### Transições válidas (proposta de formalização)

```text
FILA                  → AGUARDANDO_MATERIAL | PRODUCAO | CANCELADA
AGUARDANDO_MATERIAL   → FILA | PRODUCAO | CANCELADA
PRODUCAO              → ACABAMENTO | PAUSADA | FINALIZADA | CANCELADA
ACABAMENTO            → FINALIZADA | PAUSADA | CANCELADA
PAUSADA               → PRODUCAO | ACABAMENTO | CANCELADA
FINALIZADA            → (terminal)
CANCELADA             → (terminal)
```

### Status paralelos (já existem no schema)

Estes campos vivem dentro de `ordens_servico` e existem em paralelo ao status principal. **Devem ser respeitados pela Home como filtros e alertas.**

#### `aprovacao_tecnica_status`

```text
PENDENTE | APROVADA | REJEITADA
```

- A Home expõe alerta `OS aguardando revisão técnica` quando `PENDENTE` por mais de X horas.

#### `aprovacao_gerencial`

```text
PENDENTE | APROVADA | REJEITADA
```

- Aplica-se apenas a `tipo_os = INTERNA`.

#### `status_liberacao_pcp` (em `itens_os`)

```text
PENDENTE | LIBERADO | EM_PRODUCAO | CONCLUIDO
```

- A Home agrega por item, não apenas pela OS inteira.

### Eventos que cada transição da OS dispara

| transição | evento de domínio | consumidor |
| --- | --- | --- |
| criação | `OSCriada` | estoque (validação), Home |
| `aprovacao_tecnica_status: PENDENTE → APROVADA` | `OSAprovacaoTecnica` | PCP (libera workflow) |
| `status_liberacao_pcp: PENDENTE → LIBERADO` | `OSLiberadaPCP` | estoque (reserva), PCP |
| `PRODUCAO → ACABAMENTO` | `OSAvancouEtapa` | Home |
| `* → FINALIZADA` | `OSFinalizada` | financeiro (saldo cobrável), Home |
| `* → CANCELADA` | `OSCancelada` | estoque (libera reserva) |

## 3. Status de Cobrança (Financeiro mínimo)

Estes status **ainda não existem** no schema. Serão criados na Fase 6.

### Status propostos

```text
SEM_COBRANCA
PREVISTA_ENTRADA
PREVISTA_SALDO
PARCIAL_PAGO
LIQUIDADO
VENCIDO
CANCELADA
```

### Labels visíveis (pt-BR)

| status | label curto | descrição |
| --- | --- | --- |
| `SEM_COBRANCA` | Sem cobrança | Orçamento sem condição estruturada (ex.: cortesia, amostra) |
| `PREVISTA_ENTRADA` | Aguardando entrada | Previsão de sinal a receber |
| `PREVISTA_SALDO` | Aguardando saldo | Saldo restante a receber |
| `PARCIAL_PAGO` | Pago parcial | Recebeu entrada, falta saldo |
| `LIQUIDADO` | Liquidado | Recebeu tudo |
| `VENCIDO` | Vencido | Prazo expirou |
| `CANCELADA` | Cancelada | Cobrança cancelada (orçamento cancelado, devolução, etc.) |

### Transições propostas

```text
SEM_COBRANCA       → (não muda, exceto manual)
PREVISTA_ENTRADA   → PARCIAL_PAGO | LIQUIDADO | VENCIDO | CANCELADA
PREVISTA_SALDO     → LIQUIDADO | VENCIDO | CANCELADA
PARCIAL_PAGO       → LIQUIDADO | VENCIDO | CANCELADA
LIQUIDADO          → (terminal)
VENCIDO            → PARCIAL_PAGO | LIQUIDADO | CANCELADA
CANCELADA          → (terminal)
```

### Eventos que cada transição dispara

| transição | evento de domínio | consumidor |
| --- | --- | --- |
| criação automática | `CobrancaCriada` | Home, auditoria |
| `* → PARCIAL_PAGO` | `EntradaRecebida` | Home (atualiza resumo) |
| `* → LIQUIDADO` | `CobrancaLiquidada` | Home, OS (marca pronto + recebido) |
| `* → VENCIDO` | `CobrancaVencida` | Home (alerta crítico) |
| `* → CANCELADA` | `CobrancaCancelada` | Home, log de auditoria |

## 4. Regras gerais

- Nenhuma transição pode ser feita sem registro em log (`OrcamentoLog`, `OrdemServicoLog` ou tabela de log do financeiro).
- A Home **lê** os status atuais via endpoints do módulo `home-operacional`. **Não escreve.**
- A camada de eventos será implementada na Fase 4 (fluxo) e Fase 6 (financeiro). Por enquanto, o agregador da Home consulta o estado atual diretamente.

## Pontos de confirmação

1. As transições propostas da OS estão corretas para o fluxo real do cliente? (a sequência `PRODUCAO → ACABAMENTO → FINALIZADA` cobre o caso típico, mas pode haver pedidos que pulam acabamento).
2. Para o financeiro: criar status `VENCIDO` automaticamente após X dias, ou somente quando o usuário marcar? Recomendação inicial: **automaticamente** após `data_vencimento + 1 dia`, com job diário, e o usuário pode reverter manualmente.
3. O nome `CONCLUIDO` do orçamento e `FINALIZADA` da OS são intencionalmente diferentes para distinguir contextos. Manter?
