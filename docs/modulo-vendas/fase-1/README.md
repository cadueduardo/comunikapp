# Fase 1 — Contratos de domínio, dados e compatibilidade

**Status:** em andamento  
**Base:** checkpoint Gate 0S `ab79e8ef` / `gate0s-tecnico-2026-08-04`  
**Plano:** [`../PLANO-ACAO-MODULO-VENDAS.md`](../PLANO-ACAO-MODULO-VENDAS.md) §5  
**Migrations:** M1.1–M1.4 em [`../fase-0/06-plano-de-migrations.md`](../fase-0/06-plano-de-migrations.md)

> Publicação do módulo continua bloqueada pelo backlog operacional do Gate 0S.
> Desenvolvimento local está liberado.

## Escopo

- D-04 / DV-14 — `status_comercial` + backfill + derivação do `status` legado
- D-05 / DV-15 — versão enviada/aceita, religar writer de `VersaoOrcamento`
- D-07 / DV-07 — `validade_dias` / `expira_em`
- Eventos comerciais em `HistoricoOrcamento` (+ `loja_id`)
- Chat canônico = `MensagemChat`; descontinuar superfície de `mensagens-negociacao`
- Substituir `@Body() dados: any` nos pontos tocados

## Progresso

- [x] M1.1 `vendas_add_status_comercial_orcamento`
- [x] M1.2 `vendas_add_versao_e_aceite_orcamento`
- [x] M1.3 `vendas_add_validade_proposta_estruturada`
- [x] M1.4 `vendas_add_evento_comercial`
- [x] Serviços/helpers de transição e derivação (M1.1 dual-write)
- [ ] DTOs tipados nos endpoints tocados
- [x] Testes de invariantes (status, hash material, validade, eventos)
- [ ] Chat canônico = MensagemChat / descontinuar mensagens-negociacao
- [ ] **FASE 1 CONCLUÍDA**

## Regras

- Migrations aditivas e **depois** de HS-04/HS-05 no histórico.
- Não alterar scripts de deploy nem observabilidade do Gate 0S.
- Não dropar colunas/tabelas legadas nesta fase.
