# Fase 1 — Contratos de domínio, dados e compatibilidade

**Status:** **FASE 1 CONCLUÍDA** (2026-08-04)
**Base:** checkpoint Gate 0S `ab79e8ef` / `gate0s-tecnico-2026-08-04`
**HEAD de fechamento:** ver commit desta entrega em `feat/modulo-vendas`
**Plano:** [`../PLANO-ACAO-MODULO-VENDAS.md`](../PLANO-ACAO-MODULO-VENDAS.md) §5
**Migrations:** M1.1–M1.4 em [`../fase-0/06-plano-de-migrations.md`](../fase-0/06-plano-de-migrations.md)
**Contratos diferidos (sem schema):** [`contratos-diferidos.md`](./contratos-diferidos.md)

> Publicação do módulo continua bloqueada pelo backlog operacional do Gate 0S.
> Desenvolvimento local das fases seguintes está liberado após este gate.

## Escopo entregue

- D-04 / DV-14 — `status_comercial` + backfill + dual-write do `status` legado
- D-05 / DV-15 — versão enviada/aceita, writer de `VersaoOrcamento`, snapshot/`hash_material`
- DV-02 — invalidação de aceite por alteração material (`houveAlteracaoMaterial` + wire na edição)
- D-07 / DV-07 — `validade_dias` / `expira_em` no envio
- Eventos em `HistoricoOrcamento` (`loja_id`, `evento`, `payload`)
- Chat canônico = `MensagemChat`; escritas de `mensagens-negociacao` → 410 (órfãs)
- DTOs tipados no create/update de orçamento

## Progresso

- [x] M1.1 `vendas_add_status_comercial_orcamento`
- [x] M1.2 `vendas_add_versao_e_aceite_orcamento`
- [x] M1.3 `vendas_add_validade_proposta_estruturada`
- [x] M1.4 `vendas_add_evento_comercial`
- [x] Serviços/helpers de transição e derivação
- [x] DTOs tipados nos endpoints tocados
- [x] Testes de invariantes (status, versão, validade, eventos, chat 410, aceite)
- [x] Chat canônico = MensagemChat / descontinuar escritas órfãs
- [x] Contratos diferidos documentados (F4/F5/F6/F8) — sem migration especulativa
- [x] **FASE 1 CONCLUÍDA**

## Evidências de validação

| Checagem | Evidência |
|---|---|
| `prisma validate` | schema válido |
| SQL M1.x em MySQL 8 | job CI `gate0s-mysql8` + DB `comunikapp_m1` + fixture `pre-m1-minimal.sql` |
| Testes domínio | `status-comercial`, `versao-orcamento`, `validade-proposta`, `eventos-comerciais` |
| Aceite / HS | `orcamentos-v2-aceite-publico.spec.ts` |
| Chat 410 | `mensagens-negociacao.descontinuacao.spec.ts` + auditoria em `AGENTS.md` |
| OpenAPI | `openapi.yaml` marca POSTs legados como deprecated/410 |
| Typecheck | `npm run build` no backend |
| `git diff --check` | sem whitespace errors |

## Revisão migrations M1.1–M1.4

- Aditivas e posteriores a HS-04/HS-05 no histórico
- `loja_id` + índices FK em `HistoricoOrcamento`; FKs de versão com `ON DELETE RESTRICT`
- Sem DROP/RENAME destrutivo de colunas de negócio
- Backfill set-based; lote operacional se volume > 500k (documentado no SQL)
- Dual-write: `status`/`status_comercial`, `dados_completos`/`snapshot`
- Cada campo novo usado na mesma entrega (services/helpers)

## Fora desta fase (não implementado)

Carteira, atividades, contatos, pipeline UI, pedido/handoffs → ver `contratos-diferidos.md`.
