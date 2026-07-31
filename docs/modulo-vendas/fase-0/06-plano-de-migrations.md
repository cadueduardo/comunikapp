# Fase 0 — Plano de migrations

**Documento:** entregável "Plano de migrations, sem aplicar estrutura especulativa"
**Status:** aprovado — DV-01, DV-02, DV-07, DV-11, DV-14 e DV-15 decididas em 2026-07-31
**Referência obrigatória:** `docs/database/boas-praticas-schema-prisma.md`

> Regra que vale para todo item deste plano: **nenhuma estrutura é criada antes da
> fase que efetivamente a usa**. Se uma fase for adiada, a migration correspondente
> é adiada junto. Não existe migration "preparatória".

---

## 1. Classificação geral

| Fase | Migrations | Natureza |
|---|---|---|
| 1 | 4 | Estado comercial, versão/aceite, validade, eventos |
| 2 | 1 | Seed de perfis e permissões (dados, não estrutura) |
| 3 | 0 | Navegação não toca banco |
| 4 | 3 | Carteira, contatos, deduplicação |
| 5 | 2 | Atividades comerciais, destinatário de notificação |
| 6 | 1 | Motivo de perda |
| 7 | 2 | Alçada comercial e solicitações |
| 8 | 2 | Pedido comercial e gates |
| 9 | 0 | Reuso integral do split existente |
| 10 | 0 | Projeção de leitura, sem estrutura nova |

**Total: 15 migrations**, todas aditivas. Nenhum `DROP TABLE` ou `DROP COLUMN` no
escopo do Mínimo Operacional Seguro.

---

## 2. Fase 1 — Contratos de domínio

### M1.1 — `vendas_add_status_comercial_orcamento`

Implementa DV-14 opção A.

| Campo | Tipo | Justificativa |
|---|---|---|
| `orcamento.status_comercial` | enum Prisma novo `OrcamentoStatusComercial` | Boas práticas §"Coluna de status": enum no schema, uma fonte de verdade |

Valores do enum conforme `04-maquina-de-estados-comercial.md` §3: `rascunho`,
`aguardando_alcada`, `enviada`, `em_negociacao`, `revisao_solicitada`, `expirada`,
`aceita`, `pedido_confirmado`, `perdida`, `cancelada`.

Índices: `@@index([loja_id, status_comercial])` — a consulta real do pipeline é
sempre por loja mais status.

Backfill: script na própria migration, conforme a tabela de mapeamento de
`04-maquina-de-estados-comercial.md` §7. O caso `aprovado` exige verificar a
existência de `OrdemServico` por `orcamento_id` para distinguir `aceita` de
`pedido_confirmado`.

Compatibilidade: `status` legado permanece e passa a ser derivado. Nenhuma coluna é
removida nesta entrega.

### M1.2 — `vendas_add_versao_e_aceite_orcamento`

Implementa DV-15 opção A e a evidência de aceite exigida por DV-06 e pelo gate G1.

| Campo | Tipo | Justificativa |
|---|---|---|
| `orcamento.versao_enviada_id` | `String?` FK → `VersaoOrcamento` | Identifica a versão congelada em circulação |
| `orcamento.versao_aceita_id` | `String?` FK → `VersaoOrcamento` | Critério RP 8.6 (17): versão aceita inequívoca |
| `orcamento.enviado_em` | `DateTime?` | Hoje inexistente |
| `orcamento.aceito_em` | `DateTime?` | `data_aprovacao` não é gravado no fluxo interno |
| `orcamento.aceite_evidencia` | `Json?` | Identidade do aceitante, canal, IP, user-agent |
| `VersaoOrcamento.snapshot` | `Json` | Substitui `dados_completos String @db.LongText` — boas práticas §"Tipo Json nativo" |
| `VersaoOrcamento.hash_material` | `String?` | Comparação de alteração material (DV-02) sem varrer o JSON |

Índices: `@@index([versao_enviada_id])` e `@@index([versao_aceita_id])` — boas
práticas §"`@@index` em toda foreign key".

`onDelete`: `Restrict` nas duas FKs. Versão aceita é histórico comercial e não pode
sumir por cascata.

Observação sobre `VersaoOrcamento`: a tabela já existe
(`schema.prisma:1791–1807`) e o writer `criarNovaVersao` também
(`orcamentos-v2.service.ts:1853`), com a chamada comentada em `:1533–1537`. Esta
migration adiciona os campos que faltam; a Fase 1 religa o writer.

### M1.3 — `vendas_add_validade_proposta_estruturada`

Implementa DV-07. Hoje `validade_proposta` é `String? @default("30 dias")`.

| Campo | Tipo | Justificativa |
|---|---|---|
| `orcamento.validade_dias` | `Int?` | Valor estruturado |
| `orcamento.expira_em` | `DateTime?` | Calculado no envio, no timezone da loja |

Índice: `@@index([loja_id, expira_em])` — o job diário de expiração varre por loja e
data.

`validade_proposta` (texto) permanece por compatibilidade. Backfill: parse dos
padrões conhecidos (`"30 dias"`, `"15 dias"`); o que não parsear recebe o default
da loja e fica registrado no log da migration.

### M1.4 — `vendas_add_evento_comercial`

Implementa a trilha de eventos de `03-nomenclatura-e-matriz-rbac.md` §6.

Reaproveita `HistoricoOrcamento` (DV-15 opção A) em vez de criar tabela nova:

| Campo | Tipo | Justificativa |
|---|---|---|
| `HistoricoOrcamento.evento` | `String?` | Nome canônico do evento |
| `HistoricoOrcamento.payload` | `Json?` | Substitui `dados_novos LongText` nos registros novos |
| `HistoricoOrcamento.loja_id` | `String` | A tabela hoje **não tem** `loja_id` — boas práticas §"`loja_id` em toda tabela" |

Índices: `@@index([loja_id, evento, data])`.

Backfill de `loja_id`: derivado de `orcamento.loja_id` via join. Como a coluna é
obrigatória, a migration cria como nullable, faz o backfill e depois torna
obrigatória — três passos na mesma migration.

`OrcamentoHistorico`, `OrcamentoLog` e `aprovacaoOrcamento` são marcados como
descontinuados em comentário no schema, **sem drop**. A remoção fica para uma
migration própria, depois de `SELECT COUNT(*)` em produção, conforme boas
práticas §"Processo de migration".

---

## 3. Fase 2 — Seed de perfis e permissões

### M2.1 — `vendas_seed_perfis_e_permissoes`

**Não é mudança de estrutura.** É seed de dados, porque hoje
`backend/prisma/seed.ts` não popula `perfil_acesso` nem `perfil_permissao`.

Cria, por loja existente, os perfis `Vendedor`, `Gestor de Vendas` e as 31
permissões de `03-nomenclatura-e-matriz-rbac.md` §4, com `permitido` conforme a
matriz.

Idempotência obrigatória: `perfil_permissao` tem `@@unique([perfil_id, modulo, acao])`,
então o seed usa `upsert`. Rodar duas vezes não pode duplicar nem sobrescrever
customização já feita pela loja.

---

## 4. Fase 4 — Carteira, contatos e deduplicação

### M4.1 — `vendas_add_responsavel_comercial_cliente`

Implementa DV-11. Hoje `cliente` não tem nenhum vínculo com `usuario`.

| Campo | Tipo | Justificativa |
|---|---|---|
| `cliente.responsavel_comercial_id` | `String?` FK → `usuario` | Responsável principal da carteira |
| `cliente.responsavel_desde` | `DateTime?` | Base para "carteira parada" |

Índices: `@@index([loja_id, responsavel_comercial_id])` — é exatamente a consulta de
"Minha carteira".

`onDelete: SetNull`. Inativar vendedor **não pode** apagar cliente — RP §5.2.1 (5).

Atenção ao nome: o campo existente `cliente.responsavel String?` é o **contato dentro
do cliente**, não o vendedor. Os dois convivem. O novo campo precisa de comentário
explícito no schema para evitar confusão futura.

### M4.2 — `vendas_add_participantes_e_transferencia_carteira`

Depende de DV-11 opção B.

Duas tabelas novas:

`cliente_participante` — vendedores colaboradores:
`id`, `loja_id`, `cliente_id`, `usuario_id`, `criado_em`.
`@@unique([cliente_id, usuario_id])`, `@@index([loja_id, usuario_id])`.
`onDelete: Cascade` a partir de `cliente`.

`cliente_transferencia_carteira` — histórico auditado (RP §5.2.1 (3)):
`id`, `loja_id`, `cliente_id`, `de_usuario_id?`, `para_usuario_id`, `motivo`,
`autor_id`, `criado_em`.
`@@index([loja_id, cliente_id])`, `@@index([loja_id, criado_em])`.
`onDelete: Restrict` — histórico comercial não é apagado por cascata.

### M4.3 — `vendas_add_contatos_cliente_e_deduplicacao`

Hoje não existe tabela de contatos; há um único contato em campos escalares.

`cliente_contato`:
`id`, `loja_id`, `cliente_id`, `nome`, `email?`, `telefone?`, `whatsapp?`,
`cargo?`, `papeis Json` (solicitante, aprovador, financeiro, entrega),
`principal Boolean @default(false)`, `ativo Boolean @default(true)`,
`criado_em`, `atualizado_em`.
`@@index([loja_id, cliente_id])`, `@@index([loja_id, email])`.

Campos de deduplicação em `cliente`, para busca normalizada sem varredura
(RP §5.2.3):

| Campo | Tipo |
|---|---|
| `cliente.documento_normalizado` | `String?` — só dígitos |
| `cliente.email_normalizado` | `String?` — minúsculas, sem espaços |
| `cliente.telefone_normalizado` | `String?` — só dígitos |

Índices: `@@index([loja_id, documento_normalizado])`,
`@@index([loja_id, email_normalizado])`, `@@index([loja_id, telefone_normalizado])`.

**Não** criar `@@unique`: a deduplicação é alerta, não bloqueio automático
(RP §5.2.3). Bloquear por constraint quebraria cadastros legítimos já existentes.

Backfill: normalização dos registros atuais na própria migration.

---

## 5. Fase 5 — Atividades e notificação endereçada

### M5.1 — `vendas_add_atividade_comercial`

`atividade_comercial`:
`id`, `loja_id`, `cliente_id?`, `orcamento_id?`, `responsavel_id`, `tipo`,
`titulo`, `descricao? @db.Text`, `prazo DateTime`, `concluida_em DateTime?`,
`concluida_por?`, `criado_por`, `criado_em`, `atualizado_em`.

Índices: `@@index([loja_id, responsavel_id, prazo])` — é a consulta de "minhas
atividades vencidas"; `@@index([loja_id, cliente_id])` para a ficha 360º.

`onDelete`: `Cascade` a partir de `loja`; `SetNull` a partir de `cliente` e
`orcamento`, para não perder a atividade se o orçamento for excluído logicamente.

### M5.2 — `notificacao_add_destinatario`

Corrige D-09. Hoje `notificacao` só tem `loja_id`; não existe destinatário.

| Campo | Tipo |
|---|---|
| `notificacao.usuario_id` | `String?` FK → `usuario` |
| `notificacao.lida_em` | `DateTime?` |
| `notificacao.url_destino` | `String?` |

Índice: `@@index([loja_id, usuario_id, visualizada])`.

Nullable de propósito: notificação sem destinatário continua sendo da loja inteira,
preservando o comportamento atual de PCP e Orçamentos V2.

**Fora do escopo desta migration, registrado como dívida:**
`notificacoes-pcp.service.ts:141` grava `loja_id: 'default'` hardcoded. É correção
de outro dono.

---

## 6. Fase 6 — Motivo de perda

### M6.1 — `vendas_add_motivo_perda`

`orcamento.motivo_perda` (`String?`), `orcamento.motivo_perda_observacao`
(`String? @db.Text`), `orcamento.perdida_em` (`DateTime?`).

Índice: `@@index([loja_id, motivo_perda])` — a análise de perdas agrupa por motivo.

O catálogo de motivos fica em configuração da loja, não em enum de schema, para não
exigir migration a cada motivo novo.

---

## 7. Fase 7 — Alçada comercial

### M7.1 — `vendas_add_politica_alcada_comercial`

`politica_alcada_comercial`:
`id`, `loja_id`, `perfil_id?`, `desconto_maximo_pct Decimal(5,2)`,
`margem_minima_pct Decimal(5,2)`, `ativo`, `criado_em`, `atualizado_em`.
`@@index([loja_id, perfil_id])`.

Necessária porque `perfil_permissao` só guarda booleano `(modulo, acao, permitido)` —
não há onde guardar faixa de valor. Ver DV-04.

Nome deliberadamente distinto de `AlcadasOrcamentoService`, que é a alçada
**orçamentária** de OS (D-10).

### M7.2 — `vendas_add_solicitacao_alcada`

`solicitacao_alcada_comercial`:
`id`, `loja_id`, `orcamento_id`, `solicitante_id`, `aprovador_id?`,
`status` (`pendente | aprovada | rejeitada`), `justificativa @db.Text`,
`decisao_justificativa? @db.Text`, `snapshot_antes Json`, `snapshot_depois Json?`,
`solicitado_em`, `decidido_em?`.

Índices: `@@index([loja_id, status])` para a fila do gestor;
`@@index([loja_id, orcamento_id])`.

`onDelete: Restrict` — trilha de auditoria de decisão comercial.

---

## 8. Fase 8 — Pedido confirmado e gates

### M8.1 — `vendas_add_pedido_comercial`

Depende de DV-01 opção B.

`pedido_comercial`:
`id`, `loja_id`, `orcamento_id @unique`, `versao_aceita_id`, `cliente_id`,
`responsavel_id`, `status`, `valor_total Decimal(12,2)`, `confirmado_em`,
`cancelado_em?`, `cancelado_por?`, `motivo_cancelamento? @db.Text`,
`criado_em`, `atualizado_em`.

`orcamento_id @unique` é a **garantia estrutural de idempotência** do aceite,
seguindo o precedente de `Cobranca.orcamento_id @unique` — que é justamente o único
handoff idempotente que funciona hoje. Isso resolve a corrida descrita em
`01-auditoria-estado-real.md` §8, que a checagem por `findFirst` não resolve.

`onDelete: Restrict` a partir de `orcamento`.

Índices: `@@index([loja_id, status])`, `@@index([loja_id, responsavel_id])`,
`@@index([loja_id, cliente_id])`.

### M8.2 — `vendas_add_gates_pedido`

Depende de DV-03 opção B.

`pedido_gate`:
`id`, `loja_id`, `pedido_id`, `gate` (`comercial | sinal | arte | revisao_tecnica`),
`estado` (`nao_aplicavel | pendente | satisfeito | dispensado`),
`evidencia Json?`, `responsavel_id?`, `prazo DateTime?`,
`resolvido_em?`, `resolvido_por?`, `dispensa_justificativa? @db.Text`,
`criado_em`, `atualizado_em`.
`@@unique([pedido_id, gate])`, `@@index([loja_id, estado])`.

`configuracao_gate_loja`:
`id`, `loja_id`, `tipo_venda`, `gate`, `obrigatorio Boolean`,
`criado_em`, `atualizado_em`.
`@@unique([loja_id, tipo_venda, gate])`.

Tabela própria em vez de estender `configuracao_instalacao_loja`, porque os gates
não são exclusivos de instalação.

---

## 9. Correções de segurança sem migration

Itens que a auditoria encontrou e que violam
`docs/database/boas-praticas-schema-prisma.md` diretamente. Não exigem mudança de
schema, mas são obrigatórios nas fases indicadas:

| Item | Regra violada | Fase | Situação |
|---|---|---|---|
| `gerarCodigoAprovacao` usa `Math.random()` | §Segurança: "`Math.random().toString(36)` não é seguro criptograficamente" | 8 | Corrigido no Gate 0S (HS-04). Exigiu migration, ver §9.1 |
| `alterarStatus` imprime o código de aprovação em `console.log` | §Segurança: "Nunca logar segredo em texto puro" | 6 | Corrigido no Gate 0S |
| `links-v2.service.ts` resolve orçamento sem `loja_id` | §Segurança: "Nunca resolver um recurso multi-tenant só por `id`" | 2 | Corrigido no Gate 0S (HS-02) |
| Orçamentos V2 sem camada de autorização (`@Roles` inerte) | `AGENTS.md`: "Toda mutação sensível deve ter autorização no backend" | 2 | Corrigido no Gate 0S (HS-01) |
| `@Body() dados: any` em `orcamentos-v2.controller.ts` | §Segurança: "Todo endpoint que recebe `@Body()` precisa de DTO tipado" | 1 | Aberto nas rotas autenticadas |
| `processarAcaoClientePublico` recebe body tipado inline sem DTO | idem | 8 | Corrigido no Gate 0S (HS-03) |
| Aprovação sem `$transaction` | §Performance: "Use `$transaction` para operações que precisam ser atômicas" | 8 | Corrigido no caminho público (HS-05); `fecharPedidoInterno` segue aberto |
| `clientes.controller.ts` sem `take`/`skip` | §Performance: "Toda listagem em tabela que cresce por loja precisa de paginação" | 4 | Aberto |
| Erro público expõe status do orçamento a anônimo | `AGENTS.md`: "Erros públicos devem ser estáveis, sem confirmação indevida" | 8 | Corrigido no Gate 0S (HS-03) |

### 9.1 Migration não prevista neste plano, aplicada pelo Gate 0S

`20260731143000_orcamento_codigo_aprovacao_seguro` acrescenta a `orcamento` os campos
`codigo_aprovacao_hash`, `codigo_aprovacao_expira_em`, `codigo_aprovacao_tentativas`,
`codigo_aprovacao_usado_em` e `codigo_aprovacao_revogado_em`, e zera todos os
`codigo_aprovacao` em texto claro existentes.

Ela não estava nas 15 migrations planejadas porque o plano classificara o HS-04 como
correção sem schema. Ao implementar, ficou claro que guardar somente o hash é
impossível sem coluna de hash. A migration não é especulativa: corrige uma
vulnerabilidade em uso e todos os campos são consumidos na mesma entrega. É a etapa
"expand" de um rollout expand-and-contract — a remoção da coluna antiga e do índice
único `Orcamento_codigo_aprovacao_key` fica para entrega posterior.

Ressalva de processo: foi escrita à mão, porque não havia banco MySQL alcançável no
ambiente para rodar `prisma migrate dev`. Antes do deploy é obrigatório aplicá-la em
um banco de desenvolvimento e confirmar `prisma migrate status` sem drift.

---

## 10. Checklist obrigatório por migration

Aplicado individualmente a cada uma das 15, conforme
`docs/database/boas-praticas-schema-prisma.md` §"Checklist antes de abrir PR":

1. `npx prisma validate`.
2. `npx prisma migrate dev --name <nome-descritivo>` local — **nunca** `db push`, e nunca criar a pasta com timestamp manual.
3. `npx prisma migrate status` sem drift.
4. Revisar o SQL gerado antes de qualquer `migrate deploy`.
5. Testes do módulo afetado.
6. Teste manual cross-tenant com dois usuários de lojas diferentes para toda rota nova com `:id`.
7. `git diff --check`.
