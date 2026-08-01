# Fase 0 — Governança, auditoria e decisões bloqueadoras

**Status da fase:** **concluída documentalmente**; desenvolvimento condicionado ao hotfix de segurança
**Branch:** `feat/modulo-vendas`
**Data:** 2026-07-31

Esta pasta é o endereço oficial dos entregáveis da Fase 0 definidos em
[`../PLANO-ACAO-MODULO-VENDAS.md`](../PLANO-ACAO-MODULO-VENDAS.md) §4.

---

## Documentos

| # | Documento | Entregável do plano | Estado |
|---|-----------|---------------------|--------|
| 01 | [Auditoria do estado real](./01-auditoria-estado-real.md) | Inventário atualizado de reuso e dívidas | Concluído |
| 02 | [Decisões DV-01 a DV-17](./02-registro-de-decisoes.md) | Registro de decisões | **Decidido** |
| 03 | [Nomenclatura canônica e matriz RBAC](./03-nomenclatura-e-matriz-rbac.md) | Matriz inicial de permissões | Aprovado |
| 04 | [Máquina de estados comercial](./04-maquina-de-estados-comercial.md) | Máquina de estados proposta | Aprovado |
| 05 | [Matriz de gates](./05-matriz-de-gates.md) | Matriz de gates por cenário | Aprovado |
| 06 | [Plano de migrations](./06-plano-de-migrations.md) | Plano de migrations | Aprovado |
| 07 | [Matriz de rastreabilidade](./07-matriz-de-rastreabilidade.md) | Matriz de testes e rastreabilidade | Aprovado |
| 08 | [Resumo executivo das decisões](./08-resumo-executivo-decisoes.md) | Síntese do contrato aprovado | Concluído |
| 09 | [Gate 0S — hotfix de segurança](./09-gate-hotfix-seguranca.md) | Escopo, testes e critérios de liberação | **Em execução — Gate 0S não concluído — Fase 1 não liberada** |

Os documentos 03 a 07 passam a compor o contrato da implementação. Divergência
futura deve ser registrada como nova decisão, nunca resolvida silenciosamente no código.

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

## Decisões bloqueadoras resolvidas

O documento 02 contém 17 decisões. As 12 primeiras vêm do RP §15; DV-13 a DV-16
nasceram da auditoria da Fase 0 e são bloqueadoras; DV-17 nasceu durante o Gate 0S:

| ID | Assunto | Contrato aprovado |
|----|---------|-------------------------|
| DV-13 | Estratégia de autorização | Serviço de permissões no backend + hotfix crítico prévio |
| DV-14 | Reconciliação de status | `status_comercial` canônico com migração compatível |
| DV-15 | Destino do histórico órfão | Versão imutável + timeline canônicas; legado sem drop imediato |
| DV-16 | Ordem de entrega das fases | Segurança → contratos → autorização → navegação |
| DV-17 | Observabilidade de segurança | Projeto apartado em VPS separada; Gate 0S fica com escopo local |

---

## Gate de conclusão da Fase 0

A fase só está concluída quando:

- [x] As 17 decisões estão em estado `DECIDIDO` no documento 02.
- [x] As decisões fechadas foram replicadas no RP no mesmo commit.
- [x] Os documentos 03 a 07 saíram de "Proposto" para "Aprovado".
- [x] O checkbox **FASE 0 CONCLUÍDA** foi marcado no plano de ação.

> A conclusão deste gate não libera implementação funcional imediatamente. DV-13
> e DV-16 exigem primeiro um hotfix isolado para autorização, IDOR, rotas públicas,
> aceite transacional/idempotente e remoção de segredos dos logs.
