# Fase 1 — Contratos canônicos diferidos (sem schema nesta entrega)

**Status:** aprovado para diferimento
**Escopo:** apenas definição. **Não** cria migration, tabela ou campo.
**Referência no plano:** `PLANO-ACAO-MODULO-VENDAS.md` §5 (execução detalhada)
**Implementação:** Fases 4, 5, 6 e 8 conforme abaixo.

---

## 1. Pedido confirmado (projeção) — Fase 6

| Campo | Contrato |
|---|---|
| Entidade responsável | `orcamento` com `status_comercial = pedido_confirmado`; **não** há tabela `Pedido` |
| Identidade / `loja_id` | `orcamento.id` + `orcamento.loja_id` (obrigatório em toda leitura) |
| Relações | 1:1 opcional com `OrdemServico` (`orcamento_id` único HS-05); 1:1 opcional com `Cobranca` |
| Invariantes | Confirmação só a partir de `aceita`; no máximo uma OS por orçamento; não duplica OS Aditiva |
| Eventos | `vendas.pedido.confirmado`, `vendas.pedido.cancelado` |
| Idempotência | `UPDATE ... WHERE status_comercial = 'aceita'` + índice único OS |
| Exclusão/retenção | Soft delete do orçamento (`excluido_em`); OS/cobrança seguem donos OS/Financeiro |
| Consultas / índices futuros | `(loja_id, status_comercial, atualizado_em)`; leitura de OS por `orcamento_id` |
| Fase | **6** (handoffs e pedido) |

---

## 2. Atividade comercial e próxima ação — Fase 5

| Campo | Contrato |
|---|---|
| Entidade responsável | Nova entidade lógica `AtividadeComercial` (tabela na Fase 5); agrega sobre `HistoricoOrcamento.evento` |
| Identidade / `loja_id` | `id` + `loja_id` obrigatório; FK `orcamento_id` e opcional `cliente_id` |
| Relações | N:1 `orcamento`; N:1 `usuario` (responsável); opcional vínculo a evento |
| Invariantes | Toda atividade pertence a uma loja; próxima ação é no máximo uma aberta por orçamento |
| Eventos | Derivados dos canônicos (`vendas.proposta.*`); sem segundo vocabulário |
| Idempotência | Chave `(loja_id, orcamento_id, tipo, referencia_externa)` quando houver |
| Exclusão/retenção | Soft delete; histórico de eventos permanece em `HistoricoOrcamento` |
| Consultas / índices futuros | `(loja_id, responsavel_id, vencimento)`; `(loja_id, orcamento_id, status)` |
| Fase | **5** (pipeline e atividades) |

---

## 3. Carteira, participantes e transferência — Fase 4

| Campo | Contrato |
|---|---|
| Entidade responsável | Extensão de `cliente` + tabela de transferência (Fase 4); responsável = `usuario` |
| Identidade / `loja_id` | `cliente.id` + `cliente.loja_id`; transferência com `loja_id` próprio |
| Relações | `cliente.responsavel_comercial_id` → `usuario`; participantes N:N loja-scoped |
| Invariantes | Transferência exige permissão `vendas.carteira.transferir`; nunca cross-tenant |
| Eventos | `vendas.carteira.transferida` |
| Idempotência | `@@unique([loja_id, cliente_id, transferido_em, de_usuario_id, para_usuario_id])` ou chave de operação |
| Exclusão/retenção | Histórico de transferência imutável; cliente soft-delete existente |
| Consultas / índices futuros | `(loja_id, responsavel_comercial_id)`; `(loja_id, sem_responsavel)` |
| Fase | **4** |

---

## 4. Contatos e papéis do cliente — Fase 4

| Campo | Contrato |
|---|---|
| Entidade responsável | `ContatoCliente` (nova na Fase 4); papéis: solicitante, aprovador, financeiro, entrega, local |
| Identidade / `loja_id` | `id` + `loja_id`; FK `cliente_id` |
| Relações | N:1 `cliente`; sem orçamento obrigatório |
| Invariantes | Um contato aprovador padrão por cliente quando B2B; e-mail/telefone sem segredo em log |
| Eventos | Auditoria via histórico de cliente (fase 4); não cria evento de proposta |
| Idempotência | `@@unique([loja_id, cliente_id, email])` quando e-mail presente |
| Exclusão/retenção | Soft delete; retenção alinhada ao cliente |
| Consultas / índices futuros | `(loja_id, cliente_id, papel)` |
| Fase | **4** |

---

## 5. Payload comercial resumido (cobrança e execução) — Fase 6/8

| Campo | Contrato |
|---|---|
| Entidade responsável | Projeção de leitura (DTO), não tabela; fontes: `orcamento`, `Cobranca`, `OrdemServico` |
| Identidade / `loja_id` | Sempre filtrado por `loja_id` da sessão |
| Relações | Somente leitura dos agregados canônicos |
| Invariantes | Sem valores inventados; ausência = campo nulo/estado explícito |
| Eventos | Nenhum próprio |
| Idempotência | N/A (GET) |
| Exclusão/retenção | Segue entidades fonte |
| Consultas / índices futuros | Reusa índices de cobrança/OS; sem índice novo nesta fase |
| Fase | **6** (mínimo) / **8** (acompanhamento) |

---

## 6. Idempotência / uniqueness dos handoffs — Fase 6

| Campo | Contrato |
|---|---|
| Entidade responsável | Efeitos: OS (`orcamento_id` único), cobrança 1:1, arte/link conforme donos |
| Identidade / `loja_id` | Toda criação com `loja_id` do orçamento |
| Relações | Aceite → OS → cobrança (ordem documentada no plano Fase 6) |
| Invariantes | Clique duplo não gera segunda OS nem segunda cobrança (HS-05 + Fase 6) |
| Eventos | `vendas.pedido.confirmado`; falhas → `SEC_EVT` / auditoria sem segredo |
| Idempotência | `UPDATE` condicional + unique constraints; chave de operação em handoff |
| Exclusão/retenção | Reversão só em falha atômica pré-commit de efeitos externos |
| Consultas / índices futuros | Já: `ordens_servico.orcamento_id` unique; cobrança por `orcamento_id` |
| Fase | **6** |

---

## 7. Soft delete / retenção histórica — transversal (doc Fase 1; enforcement Fases 4–6)

| Campo | Contrato |
|---|---|
| Entidade responsável | `orcamento.excluido_em` / `excluido_por` / `motivo_exclusao` (já existentes) |
| Identidade / `loja_id` | Soft delete sempre scoped por `loja_id` |
| Relações | Histórico (`HistoricoOrcamento`) e versões **não** são apagados no soft delete |
| Invariantes | Status `EXCLUIDO` não é `status_comercial`; listagens padrão excluem soft-deleted |
| Eventos | Registro em `HistoricoOrcamento` na remoção |
| Idempotência | Soft delete repetido é no-op se já excluído |
| Exclusão/retenção | Hard delete só por processo administrativo futuro; retenção mínima = vida da loja |
| Consultas / índices futuros | `(loja_id, excluido_em)` se volume exigir |
| Fase | Política **definida aqui**; enforcement contínuo nas fases que mutam |

---

## 8. Índices de carteira, pipeline e atividades — Fases 4 e 5

Somente previsão (sem `CREATE INDEX` agora):

- Carteira: `(loja_id, responsavel_comercial_id)`, `(loja_id, atualizado_em)`
- Pipeline: `(loja_id, status_comercial, atualizado_em)` — parcial já em M1.1
- Atividades: `(loja_id, responsavel_id, vencimento)`, `(loja_id, orcamento_id, status)`

---

## 9. Chat — convivência `MensagemChat` × `mensagemnegociacao` (Fase 1)

| Campo | Contrato |
|---|---|
| Entidade responsável | **`MensagemChat`** (canônico) |
| Legado | `mensagemnegociacao` + módulo `mensagens-negociacao`: **leitura** preservada; **escrita** 410 Gone (órfã — auditoria em `AGENTS.md`) |
| Migração de dados | Não nesta entrega; drop futuro após `COUNT(*)` em produção |
| Sem terceiro chat | Escritas novas só via `orcamentos-v2` / `ChatV2Service` |
