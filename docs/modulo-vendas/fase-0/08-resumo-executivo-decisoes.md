# Fase 0 — Resumo executivo das decisões aprovadas

**Para:** product owner
**Documento de referência:** [Registro de decisões DV-01 a DV-17](./02-registro-de-decisoes.md)
**Data:** 2026-07-31 (DV-17 acrescentada em 2026-08-01)
**Tempo estimado de leitura:** 5 minutos

> Este documento não substitui o registro de decisões. Ele resume o contrato
> aprovado; o estado oficial e as salvaguardas completas permanecem no documento 02.

---

## 1. O essencial em um parágrafo

DV-01 a DV-16 foram fechadas em 2026-07-31; DV-17 foi acrescentada em 2026-08-01
(17 decisões no total). O contrato prioriza menor privilégio, consistência
transacional, idempotência, isolamento por loja, migrations aditivas, processamento
assíncrono e paginação/indexação no servidor. O início do desenvolvimento funcional
permanece condicionado ao hotfix crítico de DV-13/DV-16. DV-17 separa a
observabilidade centralizada (projeto apartado) do escopo local obrigatório do Gate 0S.

---

## 2. Decisões por ordem de impacto

A ordem abaixo segue o que destrava mais cedo, não a numeração dos IDs.

### Bloco 1 — fundação e segurança (6 decisões)

| ID | Pergunta em uma linha | Recomendação | Natureza |
|----|----------------------|--------------|----------|
| DV-16 | Começamos pela navegação ou pelos contratos? | F0 → hotfix de segurança → F1 → F2 → F3 | Estratégia de entrega |
| DV-13 | Como implementar autorização em Vendas? | Seguir o padrão de Compras (`VendasPermissionsService`) | Arquitetura |
| DV-17 | Onde fica a observabilidade de segurança? | Projeto apartado em VPS separada; Gate 0S só com escopo local | Arquitetura |
| DV-14 | Como reconciliar os três vocabulários de status? | Criar `status_comercial` novo e manter `status` por compatibilidade | Arquitetura |
| DV-15 | O que fazer com as tabelas de histórico órfãs? | Eleger `VersaoOrcamento` e `HistoricoOrcamento`; descontinuar as outras três sem drop | Arquitetura |
| DV-01 | Pedido confirmado é entidade, evento ou projeção? | Evento + tabela leve `pedido_comercial` | Arquitetura |

**Por que primeiro:** DV-16 define a sequência de todo o projeto e DV-13 bloqueia a
Fase 2 inteira. DV-17 evita que o Gate 0S seja travado por infraestrutura que ainda
não existe. DV-14, DV-15 e DV-01 definem o modelo de dados da Fase 1 — decidir
depois significa refazer migrations.

**Se o PO delegar:** as quatro últimas são legitimamente decisões de arquitetura. O
PO precisa concordar apenas com a consequência de custo, não com o desenho.

---

### Bloco 2 — contrato de produto (8 decisões)

Estas decisões definem o comportamento comercial aprovado.

| ID | Pergunta em uma linha | Recomendação | O que está em jogo |
|----|----------------------|--------------|--------------------|
| DV-02 | Que alteração invalida um aceite já dado? | Comparar snapshot da versão aceita com o estado atual, em 6 grupos de campos | Rigor contratual vs. atrito operacional |
| DV-03 | Os gates são fixos ou configuráveis? | Configuráveis por loja, com default por tipo de venda | Flexibilidade vs. custo de UI |
| DV-05 | O vendedor vê o custo interno? | Não por padrão: permissão `vendas.preco.custo.ver` desligada | Sigilo de custo vs. autonomia de negociação |
| DV-06 | Quem pode aceitar em nome do cliente B2B? | Exigir contato cadastrado com papel de aprovador | Segurança jurídica vs. fluidez do aceite |
| DV-07 | Proposta expira sozinha? Retomada exige reprecificar? | Expiração automática por job diário; revalidação obrigatória | Proteção de margem vs. atrito |
| DV-04 | Quem aprova exceção de desconto e com que limite? | Padrão de `os-approval-permissions`; limite por perfil exige tabela nova | Governança de margem |
| DV-11 | Cliente tem vendedores participantes? | Responsável principal + tabela de participantes | Colaboração vs. simplicidade |
| DV-12 | Quem enxerga todos os clientes? | Restringir com flag por loja, default aberto no piloto | **Quebra de comportamento em lojas ativas** |

**Atenção especial a DV-12 e DV-06.** As duas mudam o comportamento de lojas que já
operam hoje: DV-12 restringe visibilidade de carteira que hoje é total, e DV-06
adiciona um passo ao aceite que hoje aceita qualquer portador do código. Ambas
precisam de plano de comunicação, não só de decisão técnica.

---

### Bloco 3 — escopo posterior (3 decisões)

As decisões estão fechadas, embora a implementação pertença a fases posteriores.

| ID | Pergunta em uma linha | Recomendação | Bloqueia |
|----|----------------------|--------------|----------|
| DV-08 | Quais canais oficiais de follow-up? | In-app + e-mail padronizado no `MailService`; WhatsApp só com integração, consentimento e templates — hoje inexistente no repositório | Fase 5 |
| DV-09 | SLA entra no mínimo operacional? | Não; vai para o Núcleo Competitivo (Fase 13) | Fase 5 |
| DV-10 | Qual o escopo do pós-venda? | Aceite de entrega + satisfação simples; tickets em módulo próprio | Fase 13 |

---

## 3. Decisões com maior risco de arrependimento

Se o tempo do PO for escasso, estas três merecem a discussão mais cuidadosa, porque
reverter depois é caro:

1. **DV-01 — natureza do pedido confirmado.** Escolher projeção pura hoje e precisar
   de tabela depois significa migrar dados de pedidos já fechados. A auditoria
   mostra que projeção pura não suporta cancelamento pós-aceite nem aditivos, e que
   `Cobranca` já é 1:1 com `orcamento` — os três conceitos colapsariam num registro só.
2. **DV-14 — reconciliação de status.** É o campo que todo o pipeline lê. Trocar de
   estratégia depois exige segundo backfill sobre dados vivos.
3. **DV-12 — visibilidade de carteira.** Restringir de uma vez cumpre o critério de
   aceite 8.8 (28), mas surpreende lojas em operação. A flag por loja custa pouco
   agora e evita rollback sob pressão.

---

## 4. O que cada recomendação custa

Custos declarados no [plano de migrations](./06-plano-de-migrations.md). Todas as
migrations previstas são aditivas.

| Decisão | Exige migration? | Observação |
|---|---|---|
| DV-13 | Não | Serviço de permissões + seed de catálogo |
| DV-14 | Sim | Campo novo + backfill dos valores atuais |
| DV-15 | Não | Religar writer existente; nenhum drop |
| DV-01 | Sim | Tabela `pedido_comercial` |
| DV-02 | Não | Depende do snapshot criado em DV-15 |
| DV-03 | Sim | Configuração de gates por loja |
| DV-04 | Sim | `perfil_permissao` é booleano e não guarda faixa de valor |
| DV-05 | Não | Apenas permissão no catálogo |
| DV-06 | Sim | Contatos do cliente + evidência de aceite |
| DV-07 | Sim | `validade_proposta` hoje é texto livre; faltam `enviado_em` e `expira_em` |
| DV-08 | Sim | `notificacao` não tem destinatário por usuário |
| DV-09 | Não | Decisão de escopo; sem efeito em schema |
| DV-10 | Não | Decisão de escopo; sem efeito em schema |
| DV-11 | Sim | Coluna de responsável + tabela de participantes |
| DV-12 | Sim | Flag por loja |
| DV-16 | Não | Decisão de sequência de entrega |

---

## 5. Itens de segurança que não dependem de decisão

Estes não são decisões de produto e serão corrigidos independentemente do que o PO
escolher. Estão listados aqui apenas para ciência, com origem em
[`01-auditoria-estado-real.md`](./01-auditoria-estado-real.md):

- Ausência de camada de autorização em Orçamentos V2 (a autenticação está correta).
- `codigo_aprovacao` gerado com `Math.random()` e registrado em log em texto claro.
- Aprovação de orçamento sem transação, podendo gerar OS sem cobrança.
- IDOR na consulta de links públicos.
- Divergência entre as duas listas de rota pública do projeto.

A única decisão associada é **onde** corrigir: dentro das entregas de Vendas ou em
PR separado de segurança. Recomendação: PR separado, por ter urgência maior que o
cronograma do módulo.

---

## 6. Encaminhamento aprovado

1. Executar e validar o hotfix crítico de DV-13/DV-16 em entrega isolada.
2. Iniciar a Fase 1 apenas após evidência de autorização efetiva, correção de IDOR,
   aceite transacional/idempotente e ausência de segredos em logs.
3. Tratar o documento 02 e o RP §15 como contrato; qualquer alteração exige nova
   decisão registrada e atualização da rastreabilidade.
4. Preservar migrations aditivas e rollout gradual nas mudanças incompatíveis.
