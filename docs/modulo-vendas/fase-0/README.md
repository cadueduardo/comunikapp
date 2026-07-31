# Fase 0 — Governança, auditoria e decisões bloqueadoras

**Status da fase:** executada, **aguardando decisão do product owner**
**Branch:** `feat/modulo-vendas`
**Data:** 2026-07-31

Esta pasta é o endereço oficial dos entregáveis da Fase 0 definidos em
[`../PLANO-ACAO-MODULO-VENDAS.md`](../PLANO-ACAO-MODULO-VENDAS.md) §4.

---

## Documentos

| # | Documento | Entregável do plano | Estado |
|---|-----------|---------------------|--------|
| 01 | [Auditoria do estado real](./01-auditoria-estado-real.md) | Inventário atualizado de reuso e dívidas | Concluído |
| 02 | [Decisões DV-01 a DV-16](./02-registro-de-decisoes.md) | Registro de decisões | **Bloqueado — aguarda PO** |
| 03 | [Nomenclatura canônica e matriz RBAC](./03-nomenclatura-e-matriz-rbac.md) | Matriz inicial de permissões | Proposto |
| 04 | [Máquina de estados comercial](./04-maquina-de-estados-comercial.md) | Máquina de estados proposta | Proposto |
| 05 | [Matriz de gates](./05-matriz-de-gates.md) | Matriz de gates por cenário | Proposto |
| 06 | [Plano de migrations](./06-plano-de-migrations.md) | Plano de migrations | Proposto |
| 07 | [Matriz de rastreabilidade](./07-matriz-de-rastreabilidade.md) | Matriz de testes e rastreabilidade | Proposto |
| 08 | [Resumo executivo das decisões](./08-resumo-executivo-decisoes.md) | Apoio à reunião de kickoff | Concluído |

"Proposto" significa que o artefato está completo, mas depende de uma ou mais
decisões do documento 02 para virar contrato.

O documento 08 não é entregável previsto no plano: é um recorte do documento 02
organizado por urgência, para a reunião de decisão. O estado oficial de cada
decisão continua sendo o do documento 02.

---

## O que a auditoria mudou no plano original

A Fase 0 não confirmou o RP: ela encontrou **dez dívidas não mapeadas**, três delas
capazes de invalidar premissas do plano. Resumo em
[`01-auditoria-estado-real.md`](./01-auditoria-estado-real.md) §1.

Os três achados que mais alteram o trabalho:

1. **Orçamentos V2 não tem camada de autorização.** A autenticação é sólida
   (`JwtGlobalMiddleware` cobre token, usuário ativo, loja ativa, revogação de
   sessão e tenant do host), mas não existe `RolesGuard`: o decorator `@Roles(...)`
   é metadata inerte e as permissões declaradas não são verificadas. Hoje qualquer
   usuário autenticado da loja — inclusive `PRODUCAO` ou `ESTOQUE` — pode fechar
   pedido de qualquer orçamento. A Fase 2 deixa de ser "declarar permissões" e passa
   a ser "construir o mecanismo de autorização". Ver DV-13.
2. **A máquina de estados existe mas está desligada.** `validacao-v2.service.ts`
   implementa transições corretas que `alterarStatus` nunca chama, e o código grava
   três status (`pendente`, `enviado`, `negociando`) que não existem no enum. Ver
   DV-14.
3. **`cliente` não suporta carteira.** Não há responsável comercial, nem
   participantes, nem contatos, nem histórico de transferência. A Fase 4 é
   construção, não absorção. Ver DV-11.

---

## Decisões pendentes

O documento 02 contém 16 decisões. As 12 primeiras vêm do RP §15; as quatro últimas
nasceram desta auditoria e são bloqueadoras:

| ID | Assunto | Impacto se não decidido |
|----|---------|-------------------------|
| DV-13 | Estratégia de autorização | Fase 2 não pode começar |
| DV-14 | Reconciliação de status | Fases 1 e 6 não podem começar |
| DV-15 | Destino do histórico órfão | Fase 1 não pode começar |
| DV-16 | Ordem de entrega das fases | Sequência do projeto indefinida |

---

## Gate de conclusão da Fase 0

A fase só está concluída quando:

- [ ] As 16 decisões estão em estado `DECIDIDO` no documento 02.
- [ ] As decisões fechadas foram replicadas no RP no mesmo commit.
- [ ] Os documentos 03 a 07 saíram de "Proposto" para "Aprovado".
- [ ] O checkbox **FASE 0 CONCLUÍDA** foi marcado no plano de ação.
