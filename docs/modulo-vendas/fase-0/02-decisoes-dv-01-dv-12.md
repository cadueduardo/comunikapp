# Fase 0 — Registro de decisões de produto e arquitetura

**Documento:** entregável "Registro de decisões DV-01–DV-12" da Fase 0
**Status:** **aguardando decisão do product owner**
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
| DV-01 | Natureza do pedido confirmado | Fases 1, 8 | PENDENTE |
| DV-02 | Alterações que invalidam o aceite | Fases 1, 6 | PENDENTE |
| DV-03 | Gates por tipo de venda | Fases 1, 8 | PENDENTE |
| DV-04 | Quem aprova exceção de desconto/margem | Fases 2, 7 | PENDENTE |
| DV-05 | Exposição de custo ao comercial | Fases 2, 7 | PENDENTE |
| DV-06 | Aprovador válido do cliente B2B | Fases 1, 8 | PENDENTE |
| DV-07 | Expiração e revalidação da proposta | Fases 1, 6 | PENDENTE |
| DV-08 | Canais oficiais de follow-up | Fase 5 | PENDENTE |
| DV-09 | SLA de proposta e negociação | Fase 5 | PENDENTE |
| DV-10 | Escopo do pós-venda | Fase 13 | PENDENTE |
| DV-11 | Vendedores participantes | Fases 1, 4 | PENDENTE |
| DV-12 | Quem vê "Todos os clientes" | Fases 2, 4 | PENDENTE |
| **DV-13** | **Estratégia de autorização (novo)** | **Fase 2 — bloqueia tudo** | PENDENTE |
| **DV-14** | **Reconciliação de status (novo)** | **Fases 1, 6** | PENDENTE |
| **DV-15** | **Destino do histórico órfão (novo)** | **Fases 1, 6** | PENDENTE |
| **DV-16** | **Ordem de entrega das fases (novo)** | **Todas** | PENDENTE |

DV-13 a DV-16 não existiam no RP. Surgiram da auditoria e são bloqueadoras.

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

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

---

## DV-16 — Ordem de entrega das fases (NOVA)

**Contexto.** O RP §10 recomenda começar por "nav + home com cards" por ser valor
imediato e risco baixo. O mapa de dependências do plano coloca navegação na Fase 3,
atrás de Contratos (F1) e RBAC (F2). São estratégias opostas e ambas estão escritas
como oficiais.

**Opções.**

| Opção | Sequência | Efeito |
|---|---|---|
| **A — Vitrine antecipada** (recomendada) | F0 → F3 (nav/home só com cards de rotas existentes, sem dado novo) → F1 → F2 → demais | Algo navegável já na primeira entrega. A F3 antecipada não cria dado nem permissão, então não depende de F1/F2. A home com KPIs reais fica para depois da F2 |
| B — Plano como está | F0 → F1 → F2 → F3 → … | Corretíssimo em dependência, mas duas fases inteiras sem entrega visível |

**Recomendação: opção A**, com a ressalva explícita de que a F3 antecipada entrega
**apenas navegação e cards para rotas já existentes**. Qualquer contagem, KPI ou
fila só entra depois da Fase 2.

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

---

## DV-07 — Expiração e revalidação da proposta

**Recomendação do RP:** data real, timezone da loja, reprecificação assistida.

**O que a auditoria acrescenta.** `validade_proposta` é `String? @default("30 dias")`
— texto livre. Não existem `enviado_em` nem `expira_em`. Migration obrigatória.

**Pontos que exigem decisão:**

1. A expiração é **automática** (job diário muda o status) ou **assistida** (o status só muda quando alguém abre)? Recomendação: automática, com job diário, alinhado ao precedente já documentado para `VENCIDO` de cobrança em `docs/fase-0-home-operacional/01-status-oficiais.md`.
2. Ao retomar proposta expirada, o preço é **revalidado obrigatoriamente** ou apenas sinalizado? Recomendação: revalidação obrigatória com nova versão, atendendo ao critério RP 8.6 (21).

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

---

## DV-09 — SLA de proposta e negociação

**Recomendação do RP:** configurável por loja, com defaults e pausa justificável.

**Ponto que exige decisão:** SLA entra no Mínimo Operacional Seguro ou no Núcleo
Competitivo? O RP §14.1 não lista SLA; §14.2 lista "lembretes e automações básicas".
Recomendação: **Núcleo Competitivo (Fase 13)**, mantendo apenas "próxima ação com
prazo" no mínimo seguro.

**Decisão:** PENDENTE

---

## DV-10 — Escopo do pós-venda

**Recomendação do RP:** aceite de entrega/instalação + satisfação simples no P2;
suporte/tickets em módulo próprio.

Sem conflito com a auditoria. Confirmação formal necessária apenas para fechar a
Fase 0.

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

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

**Decisão:** PENDENTE

---

## Bloco de assinatura

| Papel | Nome | Data | Observação |
|---|---|---|---|
| Product owner | | | |
| Arquitetura | | | |

A Fase 0 só pode ser marcada como concluída quando **todas as 16 decisões** estiverem
em estado `DECIDIDO` e replicadas no RP.
