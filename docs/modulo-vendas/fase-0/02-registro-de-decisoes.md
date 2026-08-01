# Fase 0 — Registro de decisões de produto e arquitetura

**Documento:** entregável "Registro de decisões DV-01–DV-12" da Fase 0, ampliado por
DV-13 a DV-17
**Status:** **DECIDIDO — contrato aprovado para planejamento — 2026-07-31**, com DV-17
acrescentada em 2026-08-01
**Origem:** RP §15, ampliado pela auditoria em `01-auditoria-estado-real.md`

> Este é o artefato bloqueador da Fase 0. Enquanto uma decisão estiver como
> `PENDENTE`, nenhuma fase que dependa dela pode ser implementada.
>
> Ao decidir, substitua o bloco **Decisão** por `DECIDIDO — <opção> — <data>` e,
> quando a decisão divergir da recomendação, registre o motivo. A decisão fechada
> deve ser replicada no RP no mesmo commit.

---

## Índice de estado

| ID | Assunto | Bloqueia | Estado |
|----|---------|----------|--------|
| DV-01 | Natureza do pedido confirmado | Fases 1, 8 | **DECIDIDO — B** |
| DV-02 | Alterações que invalidam o aceite | Fases 1, 6 | **DECIDIDO — snapshot visível ao cliente** |
| DV-03 | Gates por tipo de venda | Fases 1, 8 | **DECIDIDO — B** |
| DV-04 | Quem aprova exceção de desconto/margem | Fases 2, 7 | **DECIDIDO — política por perfil** |
| DV-05 | Exposição de custo ao comercial | Fases 2, 7 | **DECIDIDO — A** |
| DV-06 | Aprovador válido do cliente B2B | Fases 1, 8 | **DECIDIDO — contato aprovador vinculado** |
| DV-07 | Expiração e revalidação da proposta | Fases 1, 6 | **DECIDIDO — automática + nova versão** |
| DV-08 | Canais oficiais de follow-up | Fase 5 | **DECIDIDO — in-app + e-mail** |
| DV-09 | SLA de proposta e negociação | Fase 5 | **DECIDIDO — Fase 13** |
| DV-10 | Escopo do pós-venda | Fase 13 | **DECIDIDO — aceite + satisfação** |
| DV-11 | Vendedores participantes | Fases 1, 4 | **DECIDIDO — B** |
| DV-12 | Quem vê "Todos os clientes" | Fases 2, 4 | **DECIDIDO — B com transição segura** |
| **DV-13** | **Estratégia de autorização (novo)** | **Fase 2 — bloqueia tudo** | **DECIDIDO — A + hotfix prévio** |
| **DV-14** | **Reconciliação de status (novo)** | **Fases 1, 6** | **DECIDIDO — A** |
| **DV-15** | **Destino do histórico órfão (novo)** | **Fases 1, 6** | **DECIDIDO — A** |
| **DV-16** | **Ordem de entrega das fases (novo)** | **Todas** | **DECIDIDO — B (segurança primeiro)** |
| **DV-17** | **Onde fica a observabilidade de segurança (novo)** | **Gate 0S, Fase 12** | **DECIDIDO — C (projeto apartado)** |

DV-13 a DV-16 não existiam no RP. Surgiram da auditoria e são bloqueadoras. DV-17
surgiu durante o Gate 0S, ao separar o que o hotfix precisa entregar do que depende de
infraestrutura que ainda não existe.

---

## DV-13 — Estratégia de autorização (NOVA, mais urgente)

**Contexto.** A autenticação está coberta por `JwtGlobalMiddleware`, aplicado a todas
as rotas, que valida token, usuário ativo, loja ativa, versão de sessão e tenant do
host. O que **não** existe é autorização: não há `RolesGuard`, o decorator
`@Roles(...)` é metadata inerte e as 10 permissões `orcamentos.*` declaradas não são
verificadas. Na prática, qualquer usuário autenticado da loja — inclusive `PRODUCAO`
ou `ESTOQUE` — pode fechar pedido de qualquer orçamento. Ver
`01-auditoria-estado-real.md` §§2–3.

O projeto tem um padrão que funciona: `ComprasPermissionsService`, com um catálogo
de constantes e `assertPode()` chamado dentro dos services, consultando
`perfil_permissao`.

**Opções.**

| Opção | O que envolve | Risco |
|---|---|---|
| **A — Seguir o padrão de Compras** (recomendada) | Criar `VendasPermissionsService` com catálogo `VENDAS_PERMISSOES` e `assertPode()` nos services de Vendas. Não mexer no `@Roles` alheio | Baixo. Escopo contido. Convive com o legado sem quebrá-lo |
| B — Implementar o `RolesGuard` que falta | Criar o guard que lê `ROLES_KEY` e aplicá-lo globalmente | **Alto.** Liga de uma vez 37 declarações `@Roles` hoje inertes, em dois vocabulários incompatíveis. Quebra usuários em produção imediatamente |
| C — Guard de função no estilo Instalação | `VendasPermissionsGuard` com `Set` de `usuario_funcao` | Médio. Simples, mas não entrega permissão granular; o RP exige granularidade (carteira, custo, abono, alçada) |

**Recomendação: opção A.** É a única que entrega granularidade sem detonar o
legado. A opção B deve virar item de dívida técnica com PR próprio, fora de Vendas.

**Consequência da opção A:** a Fase 2 do plano muda de "criar permissões" para
"criar o serviço de permissões de Vendas e semear o catálogo", já que hoje não
existe nem seed de perfis. Também é preciso decidir se o IDOR de `links-v2` e a
divergência entre as duas listas de rota pública (`01-auditoria-estado-real.md` §3)
são corrigidos dentro de Vendas ou em PR separado de segurança.

**Decisão:** **DECIDIDO — opção A — 2026-07-31.**

Vendas adotará `VendasPermissionsService`, catálogo canônico e `assertPode()` nos
services, seguindo o padrão funcional de Compras. Não será ativado `RolesGuard`
global dentro deste projeto, pois as 37 declarações legadas usam vocabulários
incompatíveis e sua ativação seria uma mudança transversal de alto risco.

Condições obrigatórias:

1. `usuario_funcao` é a fonte de verdade de papel; `UserRole`/`@Roles` permanece
   legado e não pode ser usado como autorização nova.
2. Toda checagem ocorre no service e recebe `usuarioId`/`lojaId` derivados do
   contexto autenticado; esconder botão não autoriza ação.
3. Permissões são carregadas de forma eficiente, com cache curto por
   `(loja_id, usuario_id, session_version)` e invalidação ao alterar perfil,
   permissão, usuário ou sessão. Cache nunca pode sobreviver à revogação.
4. O IDOR de `links-v2`, as rotas públicas divergentes, DTOs `any`, código de
   aprovação inseguro e segredo em log formam um **hotfix de segurança anterior a
   qualquer nova navegação de Vendas**. Não aguardam a Fase 2 visual.
5. O hotfix terá testes cross-tenant, rate limit nos fluxos públicos e negação por
   padrão. Não será usado um bypass temporário ou fail-open.

---

## DV-14 — Reconciliação de status (NOVA)

**Contexto.** Existem três vocabulários de status de orçamento em uso simultâneo, e
a máquina de estados implementada em `validacao-v2.service.ts` está desligada do
caminho de escrita (`alterarStatus` não a chama). Ver
`01-auditoria-estado-real.md` §4.

Valores realmente gravados no banco hoje: `rascunho`, `pendente`, `enviado`,
`negociando`, `aprovado`, `rejeitado`, `cancelado`. Valores do enum:
`rascunho`, `em_analise`, `aprovado`, `rejeitado`, `em_execucao`, `concluido`,
`cancelado`.

**Opções.**

| Opção | O que envolve |
|---|---|
| **A — Novo eixo comercial, preservando o legado** (recomendada) | Criar `status_comercial` como campo novo e canônico. Manter `status` como campo de compatibilidade, derivado. Backfill mapeando os valores atuais. `em_execucao`/`concluido` saem da superfície comercial |
| B — Corrigir o enum atual no lugar | Ampliar `OrcamentoStatus` com `enviado`, `negociando`, `expirado`, `perdido` e religar o validador | Mais barato, mas mantém comercial e execução no mesmo campo, contra o RP §4.9 (4) e o critério 8.2 |
| C — Adiar | Vendas usa o status atual como está | Inviável: o pipeline do RP §6.5 depende de estados que não existem |

**Recomendação: opção A**, com a máquina de estados detalhada em
`04-maquina-de-estados-comercial.md`.

**Decisão:** **DECIDIDO — opção A — 2026-07-31.**

Será criado `status_comercial` canônico, em enum Prisma, separado dos eixos de OS e
Financeiro. O campo `status` e `status_aprovacao` permanecem temporariamente como
compatibilidade derivada, sem escrita direta por código novo.

O backfill seguirá `04-maquina-de-estados-comercial.md` e será executado de forma
aditiva, indexada e observável. O caminho de escrita passa por um único serviço de
transição, com validação, optimistic locking e evento auditado na mesma transação.
Backfills grandes devem operar em lotes idempotentes, evitando transação única longa
e locks extensos. `em_execucao` e `concluido` não existirão no eixo comercial.

---

## DV-15 — Destino das tabelas de histórico órfãs (NOVA)

**Contexto.** Quatro tabelas de histórico/versão existem no schema; três nunca
recebem registro. Ver `01-auditoria-estado-real.md` §5.

**Opções.**

| Opção | O que envolve |
|---|---|
| **A — Eleger `VersaoOrcamento` e `HistoricoOrcamento`** (recomendada) | `VersaoOrcamento` vira o snapshot imutável da proposta (religando o writer comentado); `HistoricoOrcamento` vira a timeline de eventos. `OrcamentoHistorico`, `OrcamentoLog` e `aprovacaoOrcamento` são marcados como descontinuados, sem drop nesta entrega |
| B — Criar tabelas novas de Vendas | Ignora as órfãs e cria `venda_evento` / `venda_versao` | Vira a quinta e sexta tabela do mesmo assunto. Contra o RP §3.1 |
| C — Limpar antes de construir | Drop das três órfãs e depois construir | Migration destrutiva sem ganho funcional; contraria "migrations aditivas" |

**Recomendação: opção A.** Reaproveita o que já está modelado e evita drop.

**Decisão:** **DECIDIDO — opção A — 2026-07-31.**

`VersaoOrcamento` será a fonte canônica do snapshot imutável da proposta e
`HistoricoOrcamento` será a timeline canônica de eventos. `OrcamentoHistorico`,
`OrcamentoLog` e `aprovacaoOrcamento` ficam formalmente descontinuados, sem drop
nesta entrega e sem novos writers.

Snapshots novos usam `Json` nativo e `hash_material`; consultas de listagem não
carregam o snapshot completo. A API usa `select` mínimo e busca o conteúdo apenas no
detalhe/validação, preservando memória, banda e latência. Retenção/remoção futura das
tabelas legadas exigirá auditoria de dados e migration própria.

---

## DV-16 — Ordem de entrega das fases (NOVA)

**Contexto.** O RP §10 recomenda começar por "nav + home com cards" por ser valor
imediato e risco baixo. O mapa de dependências do plano coloca navegação na Fase 3,
atrás de Contratos (F1) e RBAC (F2). São estratégias opostas e ambas estão escritas
como oficiais.

**Opções.**

| Opção | Sequência | Efeito |
|---|---|---|
| A — Vitrine antecipada | F0 → F3 (nav/home só com cards de rotas existentes, sem dado novo) → F1 → F2 → demais | Algo navegável já na primeira entrega, porém amplia a superfície exposta antes da autorização efetiva |
| **B — Segurança e contratos primeiro** (aprovada) | F0 → hotfix de segurança → F1 → F2 → F3 → … | Preserva a ordem de dependências e impede a publicação de rotas sobre contratos inseguros |

**Recomendação inicial reavaliada:** a opção A foi rejeitada após ponderar os
achados de DV-13. A opção B oferece menor risco e evita retrabalho de contratos.

**Decisão:** **DECIDIDO — opção B — 2026-07-31.**

A ordem oficial permanece a do plano de dependências:

```text
F0 → hotfix de segurança → F1 contratos/dados → F2 autorização → F3 navegação → demais
```

A vitrine não será antecipada. Criar novos caminhos para Orçamentos enquanto a
autorização é inerte aumenta a superfície de ataque e consolida contratos ainda não
reconciliados. A primeira entrega visível ocorrerá após segurança e contratos. Para
reduzir tempo sem sacrificar a ordem, auditorias, design e componentes sem escrita
podem ser preparados em paralelo, mas nenhuma rota nova será publicada antes do gate
de F2.

---

## DV-01 — Pedido confirmado: entidade, evento ou projeção?

**Recomendação do RP:** começar como evento/projeção; criar tabela só se houver
comportamento próprio.

**O que a auditoria acrescenta.** Uma projeção pura sobre `orcamento` não consegue
representar: cancelamento pós-aceite sem cancelar o orçamento, aditivos vinculados
ao pedido e não ao orçamento original, e gates com responsável e prazo próprios.
Além disso, `Cobranca` já é 1:1 com `orcamento` — se o pedido também for projeção do
orçamento, os três conceitos colapsam num só registro.

**Opções.**

| Opção | Consequência |
|---|---|
| A — Projeção pura sobre `orcamento` aceito | Sem migration. Não suporta cancelamento independente nem gates com prazo |
| **B — Evento + tabela leve de pedido** (recomendada) | `pedido_comercial` com `orcamento_id`, `versao_aceita_id`, `status`, `aceito_em`, `evidencia_aceite`, `cancelado_em`. Migration pequena, comportamento próprio garantido |
| C — Entidade completa com itens próprios | Duplica `ProdutoOrcamento` e a OS. Contra o RP §1 |

**Decisão:** **DECIDIDO — opção B, evento + tabela leve — 2026-07-31.**

Será criado `pedido_comercial` como agregado leve, 1:1 com o orçamento aceito, sem
duplicar itens, produto, cálculo ou OS. A confirmação publica o evento
`vendas.pedido.confirmado`; a tabela mantém identidade, versão aceita, cliente,
responsável, valor-snapshot, estado e cancelamento.

Requisitos estruturais:

- `loja_id` obrigatório e índices compostos orientados a status, responsável e
  cliente;
- `orcamento_id @unique` e chave idempotente para eliminar corrida de aceite;
- `versao_aceita_id` com `onDelete: Restrict`;
- mutação transacional curta para pedido + auditoria; handoffs externos usam outbox
  ou comandos idempotentes, nunca chamadas de rede dentro da transação;
- listagens usam projeções/selects mínimos e paginação por cursor quando o volume
  justificar, sem carregar snapshots ou relações pesadas.

---

## DV-02 — O que invalida o aceite

**Recomendação do RP:** preço, itens, quantidades, prazo, entrega/instalação,
condição de pagamento e termos.

**O que a auditoria acrescenta.** Como a versão enviada nunca é congelada hoje
(`VersaoOrcamento` não é escrita), "alteração material" precisa ser definida como
diferença entre o **snapshot da versão aceita** e o estado atual — não como um
gatilho por campo editado.

Campos candidatos a materiais, com base no schema real:

| Grupo | Campos |
|---|---|
| Preço | `preco_final`, `valor_total`, `margem_lucro`, `impostos` |
| Escopo | conjunto de `ProdutoOrcamento` (itens, quantidades, especificações) |
| Prazo | `prazo_entrega`, `data_limite` |
| Entrega | `entrega_modalidade_id`, endereço, `entrega_prazo_dias`, `entrega_valor_cobrado` |
| Terceirização | `terceirizacao_prazo_dias`, `terceirizacao_custo_total` de qualquer item |
| Pagamento | `condicao_pagamento_tipo`, `_entrada_pct`, `_parcelas` |

Alterações **não materiais** propostas: `observacoes`, `tags`, `categoria`,
`atendente`, anexos internos.

**Decisão:** **DECIDIDO — comparar o snapshot visível aceito — 2026-07-31.**

Invalidam o aceite somente alterações materiais percebidas pelo cliente:

1. preço unitário, desconto, acréscimo, preço total ou tributo destacado;
2. inclusão, remoção ou alteração de item, quantidade, unidade, especificação,
   material/acabamento visível ou personalização;
3. prazo de entrega/execução e validade;
4. modalidade, endereço, prazo e valor de entrega/instalação;
5. condição de pagamento, entrada, parcelas, vencimentos e termos comerciais;
6. terceirização apenas quando mudar escopo, executor comunicado ou prazo/condição
   apresentados ao cliente.

Não invalidam por si só: custo interno, margem, comissão, fornecedor interno não
divulgado, tags, categoria, observações internas e anexos exclusivamente internos.
Se qualquer alteração interna mudar um campo visível, o hash material muda e um novo
aceite é obrigatório.

O `hash_material` será calculado no backend sobre representação canônica ordenada,
com versão do algoritmo. Nunca confiar em hash enviado pelo cliente. Depois de
`pedido_confirmado`, alteração material segue aditivo/cancelamento formal; não edita
o pedido silenciosamente.

---

## DV-03 — Gates por tipo de venda

**Recomendação do RP:** matriz configurável por loja/tipo de produto; nunca um
booleano global.

Proposta detalhada em `05-matriz-de-gates.md`. A decisão aqui é apenas sobre o
**nível de configurabilidade**:

| Opção | Consequência |
|---|---|
| A — Fixo em código por tipo de produto | Sem migration; inflexível por loja |
| **B — Configurável por loja, com default por tipo de venda** (recomendada) | Uma tabela de configuração de gates por loja. Alinhado ao precedente de `configuracao_instalacao_loja` |
| C — Configurável por produto | Granularidade que ninguém pediu; custo alto de UI |

**Decisão:** **DECIDIDO — opção B — 2026-07-31.**

Os gates serão configuráveis por loja, com defaults versionados por tipo de venda,
em tabela própria do domínio comercial. Não serão adicionados a
`configuracao_instalacao_loja` e não haverá configuração por produto no primeiro
ciclo.

Regras fechadas:

- G1 comercial é obrigatório para toda venda;
- G2 sinal deriva prioritariamente da condição de pagamento; configuração não pode
  dispensar entrada contratualmente exigida;
- G3 Arte é definido pela necessidade de prova do item;
- G4 revisão técnica segue tipo/complexidade operacional;
- dispensa fica restrita a Administrador no primeiro ciclo, com justificativa e
  auditoria, sem permissão padrão do vendedor;
- avaliação é independente, indexada e orientada a eventos dos domínios donos;
  Vendas não faz polling N×M nem replica status de Arte/Financeiro/OS.

---

## DV-04 — Quem aprova exceção de desconto/margem

**Recomendação do RP:** permissão granular + limite por perfil; ADMIN não substitui
trilha de auditoria.

**O que a auditoria acrescenta.** Já existe precedente direto em
`backend/src/os/services/os-approval-permissions.service.ts`, com quatro níveis de
aprovação de OS consultando `perfil_permissao`. A alçada comercial deve seguir esse
padrão em vez de inventar outro.

Atenção à colisão de nome com `AlcadasOrcamentoService`
(`01-auditoria-estado-real.md` §11). Sugestão de nomenclatura para evitar ambiguidade:
**"alçada comercial"** para desconto/margem, mantendo "alçada orçamentária" para o
serviço existente de OS.

**Ponto que exige decisão:** o limite é por **perfil** (tabela `perfil_acesso`) ou
por **usuário**? O RP diz "por perfil"; o modelo `perfil_permissao` só tem
`(modulo, acao, permitido)` — booleano, **sem campo de valor**. Guardar faixa de
desconto exige tabela nova.

**Decisão:** **DECIDIDO — política numérica por perfil — 2026-07-31.**

Limites pertencem ao perfil de acesso, não ao usuário. A permissão booleana define
quem solicita/decide; `politica_alcada_comercial` guarda desconto máximo e margem
mínima. Em múltiplos perfis, vale a política mais permissiva explicitamente
atribuída, registrada na decisão para auditoria.

Controles obrigatórios:

- ninguém aprova a própria solicitação;
- aprovação exige `vendas.alcada.aprovar` e limite compatível com a exceção;
- Admin pode decidir como bypass administrativo, mas nunca sem justificativa,
  snapshot e auditoria;
- decisão usa optimistic locking e `status = pendente` na condição do update;
- política efetiva pode ser cacheada por usuário/loja com invalidação ao alterar
  perfil/política;
- o nome técnico é **alçada comercial**, sem reutilizar
  `AlcadasOrcamentoService` de OS.

---

## DV-05 — Comercial vê custo detalhado ou só margem?

**Esta decisão tem hoje três tratamentos conflitantes no RP** e precisa ser
unificada:

| Local do RP | O que diz |
|---|---|
| §6.3, linha de "Custo interno na precificação" | "Decisão de implementação — fechar no kickoff" |
| §15, DV-05 | "Permissão separada; padrão de equipe mostra informação mínima" |
| §7, E4-2 | P2, marcado ⏸️ congelado, "não agora" |
| Plano, Fase 2 | "Criar permissões de ver custo/margem" — implementar já |

**Opções.**

| Opção | Consequência |
|---|---|
| **A — Permissão granular já na Fase 2** (recomendada) | `vendas.preco.custo.ver` desligada por padrão para `VENDAS`. O vendedor vê preço sugerido, margem resultante e limite. Remove E4-2 do congelamento e resolve o conflito |
| B — Manter congelado (E4-2) | Vendedor precifica sem referência de piso. Risco de margem já registrado no RP §9 |
| C — Mostrar custo a todo perfil VENDAS | Simples, mas expõe custo interno por padrão, contra o princípio de menor privilégio |

**Decisão:** **DECIDIDO — opção A — 2026-07-31.**

Será criada `vendas.preco.custo.ver`, negada por padrão ao Vendedor e concedida ao
Gestor, Financeiro e Admin conforme matriz. O vendedor de equipe vê preço sugerido,
margem resultante/indicador de limite e alertas de alçada, mas não composição de
custo, fornecedor, salário, imposto interno ou demais detalhes protegidos.

A proteção é aplicada no backend com DTO/projeção própria; ocultar coluna no frontend
não é suficiente. Endpoints de lista, exportação, PDF, websocket, log e erro também
devem omitir custo. A resposta deve selecionar apenas campos autorizados no banco,
evitando buscar e depois remover dados sensíveis desnecessariamente.

---

## DV-06 — Aprovador válido do cliente B2B

**Recomendação do RP:** contato/papel registrado + evidência do aceite.

**O que a auditoria acrescenta.** Hoje **não existe tabela de contatos do cliente**
(um único contato em campos escalares) e o aceite **não grava evidência alguma** —
nem quem aceitou, nem IP, nem user-agent, nem timestamp dedicado. O
`codigo_aprovacao` é gerado com `Math.random()`.

Portanto DV-06 não é configuração: é migration de contatos (Fase 4) + migration de
evidência de aceite (Fase 1) + substituição do gerador de código (Fase 8).

**Ponto que exige decisão:** o aceite exige **contato cadastrado com papel de
aprovador**, ou aceita qualquer portador do código? A primeira opção é mais segura e
mais próxima do benchmark; a segunda preserva o fluxo atual sem atrito.

**Decisão:** **DECIDIDO — contato vinculado com papel de aprovador — 2026-07-31.**

O envio para aceite deve selecionar um `cliente_contato` ativo, do mesmo tenant e
com papel `aprovador`. O token é vinculado a orçamento, versão, contato, finalidade
e expiração. Qualquer portador do código genérico deixa de ser suficiente.

Segurança obrigatória:

- token opaco gerado por CSPRNG, armazenado como hash, uso único/revogável e
  comparação em tempo constante;
- rate limit por token/IP/tenant, contador de tentativas e bloqueio progressivo;
- não revelar se orçamento, contato ou token existe;
- IP e user-agent vêm da requisição confiável/proxy configurado, nunca de query;
- evidência registra contato, versão, canal, data/hora UTC, IP normalizado e
  user-agent sanitizado, com minimização e política de retenção;
- aceite manual interno exige permissão específica, motivo e evidência do canal;
  é distinguido de autoaceite do cliente;
- assinatura eletrônica jurídica permanece evolução própria; esta evidência é
  aceite auditável, não promessa de assinatura qualificada.

---

## DV-07 — Expiração e revalidação da proposta

**Recomendação do RP:** data real, timezone da loja, reprecificação assistida.

**O que a auditoria acrescenta.** `validade_proposta` é `String? @default("30 dias")`
— texto livre. Não existem `enviado_em` nem `expira_em`. Migration obrigatória.

**Pontos que exigem decisão:**

1. A expiração é **automática** (job diário muda o status) ou **assistida** (o status só muda quando alguém abre)? Recomendação: automática, com job diário, alinhado ao precedente já documentado para `VENCIDO` de cobrança em `docs/fase-0-home-operacional/01-status-oficiais.md`.
2. Ao retomar proposta expirada, o preço é **revalidado obrigatoriamente** ou apenas sinalizado? Recomendação: revalidação obrigatória com nova versão, atendendo ao critério RP 8.6 (21).

**Decisão:** **DECIDIDO — expiração automática e revalidação obrigatória — 2026-07-31.**

`expira_em` é calculado no envio a partir da política/validade e convertido para UTC,
preservando timezone da loja para exibição e regra de calendário. Um job global
processa propostas vencidas em lotes indexados por `(status_comercial, expira_em)`,
com paginação por cursor, idempotência e execução concorrente segura. Não haverá um
job por loja nem full scan diário.

Reabrir proposta expirada exige recalcular custos/prazos, criar nova versão, nova
validade e novo link/token. O sistema não reaproveita aceite, alçada ou validade
anteriores. Falha do job não autoriza aceite: o endpoint valida `expira_em` em tempo
real antes de aceitar.

---

## DV-08 — Canais oficiais de follow-up

**Recomendação do RP:** in-app e e-mail no P1; WhatsApp só com integração,
consentimento e templates.

**O que a auditoria acrescenta.** O in-app existe (`notificacao`), mas **não tem
destinatário por usuário** — só `loja_id`. E-mail existe via `MailService`, mas o
domínio Arte mantém um nodemailer próprio em paralelo. Não há integração de WhatsApp
no repositório.

Adotar in-app + e-mail exige, portanto, uma migration em `notificacao` e a decisão
de padronizar o envio de e-mail no `MailService`.

**Decisão:** **DECIDIDO — in-app endereçado + e-mail pelo MailService — 2026-07-31.**

O primeiro ciclo suporta notificações in-app por usuário e e-mail centralizado no
`MailService`. WhatsApp fica fora até existir integração oficial, consentimento,
templates aprovados, opt-out, observabilidade e deduplicação.

Envios são assíncronos via fila/outbox, com chave de deduplicação por
evento+destinatário+canal, retry com backoff e dead-letter. O request comercial não
aguarda SMTP. Falha de e-mail não reverte o evento de negócio, mas permanece visível
para reprocessamento. Preferências e consentimentos são validados antes de enfileirar.

---

## DV-09 — SLA de proposta e negociação

**Recomendação do RP:** configurável por loja, com defaults e pausa justificável.

**Ponto que exige decisão:** SLA entra no Mínimo Operacional Seguro ou no Núcleo
Competitivo? O RP §14.1 não lista SLA; §14.2 lista "lembretes e automações básicas".
Recomendação: **Núcleo Competitivo (Fase 13)**, mantendo apenas "próxima ação com
prazo" no mínimo seguro.

**Decisão:** **DECIDIDO — Núcleo Competitivo/Fase 13 — 2026-07-31.**

O Mínimo Operacional Seguro inclui próxima ação com responsável e prazo, mas não um
motor de SLA. SLA configurável, pausa justificada, calendário útil, escalonamento e
indicadores entram na Fase 13. Isso evita criar automação prematura sem dados de uso.
Consultas futuras devem ser baseadas em prazos indexados e processamento em lote,
não timers individuais em memória.

---

## DV-10 — Escopo do pós-venda

**Recomendação do RP:** aceite de entrega/instalação + satisfação simples no P2;
suporte/tickets em módulo próprio.

Sem conflito com a auditoria. Confirmação formal necessária apenas para fechar a
Fase 0.

**Decisão:** **DECIDIDO — aceite de entrega/instalação + satisfação simples — 2026-07-31.**

Vendas registra fechamento comercial, aceite de entrega/instalação, nota simples de
satisfação, comentário opcional e próxima ação/recompra. Chamados, suporte, garantia,
SLA técnico e assistência pertencem a módulo próprio e não serão improvisados em
Vendas. Pesquisa usa link revogável e proteção equivalente aos demais links públicos.

---

## DV-11 — Vendedores participantes

**Recomendação do RP:** sim, com um responsável principal; participantes não
recebem poderes de gestão automaticamente.

**O que a auditoria acrescenta.** `cliente` não tem nem responsável principal hoje.
Participantes implicam tabela de junção adicional.

**Opções.**

| Opção | Custo | Consequência |
|---|---|---|
| A — Só responsável principal no primeiro ciclo | 1 coluna + FK + índice | Atende "Minha carteira"; não atende colaboração |
| **B — Responsável + tabela de participantes** (recomendada) | 1 coluna + 1 tabela de junção | Atende E3B-7, que é P0 no RP |

**Decisão:** **DECIDIDO — opção B — 2026-07-31.**

Cada cliente terá um responsável comercial principal e zero ou mais participantes.
A junção possui `loja_id`, unicidade `(cliente_id, usuario_id)` e índices para
“Minha carteira”. Participar concede visibilidade/colaboração prevista na permissão,
não poderes de gestor, transferência ou alçada.

Transferência do principal e inclusão/remoção de participantes são transacionais e
auditadas. Inativação de vendedor não apaga cliente nem histórico; gera fila de
redistribuição. Listagens são paginadas no servidor e filtradas por índices, sem
carregar participantes por N+1.

---

## DV-12 — Quem vê "Todos os clientes"

**Recomendação do RP:** gestor/admin por padrão; demais só por permissão explícita.

**Ponto que exige decisão:** hoje **todo usuário autenticado vê todos os clientes** —
`clientes.controller.ts` não filtra por responsável e não tem paginação de servidor.
Restringir para "Minha carteira" por padrão é, na prática, **uma quebra de
comportamento** para lojas que já operam assim.

**Opções.**

| Opção | Consequência |
|---|---|
| A — Restringir para todos imediatamente | Cumpre o critério RP 8.8 (28); pode surpreender lojas em operação |
| **B — Restringir com flag por loja, default aberto no piloto** (recomendada) | Permite rollout gradual conforme a Fase 12; a flag é removida quando todas as lojas estiverem migradas |

**Decisão:** **DECIDIDO — opção B, transição por loja — 2026-07-31.**

Gestor/Admin veem todos por permissão; Vendedor entra em Minha carteira. Para evitar
quebra abrupta, lojas existentes iniciam com compatibilidade aberta por flag
temporária e plano de migração; lojas novas e piloto iniciam com carteira restrita
(menor privilégio). A flag possui data de remoção e telemetria de uso; não se torna
configuração permanente para contornar RBAC.

Mesmo no modo compatível, ações sensíveis continuam exigindo permissão. A busca de
deduplicação pode retornar correspondência mínima de cliente fora da carteira, sem
expor contatos, histórico, valores ou responsável. Toda consulta permanece limitada
ao `loja_id` autenticado e paginada no servidor.

---

## DV-17 — Onde fica a observabilidade de segurança (NOVA)

**Contexto.** O HS-06 do Gate 0S pedia "métricas agregadas e alertas para aumento
anormal de 401, 403, 404 público, 429, conflitos e falhas parciais". O substrato de
eventos foi entregue e comprovado, mas o projeto não tem — nem deve ganhar às pressas —
um destino para essas métricas. A análise em
[`10-observabilidade-e-logs-producao.md`](./10-observabilidade-e-logs-producao.md) §2
mostrou que instalar uma stack de observabilidade na VPS principal significa somar
serviços, memória e superfície de manutenção ao host que roda a aplicação.

**Opções.**

| Opção | O que envolve |
|---|---|
| A — Instalar a stack na VPS principal | Resolve mais rápido, mas concorre por recursos com a aplicação e amplia a superfície do host de produção |
| B — Contratar SaaS de observabilidade | Menos operação, porém envia evento de segurança para fora do perímetro — o oposto do que o HS-06 trata |
| **C — Projeto apartado em VPS separada** (aprovada) | Coleta centralizada fora do host de produção; o Gate 0S entrega apenas o escopo local |

**Decisão:** **DECIDIDO — opção C — 2026-08-01.**

A observabilidade centralizada é um projeto próprio, provavelmente em VPS separada da
Oracle com recursos limitados. Nenhuma plataforma de observabilidade — Prometheus,
Grafana, Loki, Sentry, OpenTelemetry ou equivalente — é instalada no Gate 0S ou na VPS
principal.

O contrato do HS-06 passa a ser separado em dois:

**Obrigatório no Gate 0S (local):** eventos estruturados e sanitizados; ausência de
segredo e dado sensível; baixa cardinalidade; logs locais consultáveis; runbook de
investigação; critérios de incidente; comprovação manual dos cinco tipos de evento;
rollback fail-closed.

**Projeto futuro:** coleta centralizada em VPS separada; armazenamento e retenção;
dashboards; alertas automáticos; correlação entre instâncias e reinícios;
pseudonimização estável, se necessária; segurança de transporte entre as VPS;
dimensionamento e escolha da stack.

Métricas centralizadas e alertas automáticos deixam de bloquear o Gate 0S. Isso não
dispensa nada do escopo local — que é o que responde, hoje, à pergunta "está
acontecendo alguma coisa anormal?", por consulta manual ao log do PM2.

---

## Bloco de assinatura

| Papel | Nome | Data | Observação |
|---|---|---|---|
| Product owner | Aprovação registrada por solicitação do projeto | 2026-07-31 | As 16 decisões passam a compor o contrato funcional do módulo |
| Arquitetura | Consolidação técnica da Fase 0 | 2026-07-31 | Segurança, desempenho, escalabilidade e compatibilidade incorporados às decisões |
| Arquitetura | Decisão de observabilidade | 2026-08-01 | DV-17: coleta centralizada vira projeto apartado; HS-06 fica com o escopo local |

As **17 decisões estão em estado `DECIDIDO`**. A Fase 0 pode ser encerrada após a
replicação deste contrato no RP, no plano de ação e nos artefatos derivados. Esse
encerramento é documental: **não autoriza iniciar funcionalidade de Vendas antes do
hotfix de segurança definido em DV-13 e DV-16**.
