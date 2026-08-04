# Backlog operacional do Gate 0S (pós-checkpoint)

**Checkpoint:** `ab79e8ef76b2411f8928f1db60dcec6d81865411`  
**Tag:** `gate0s-tecnico-2026-08-04`  
**Estado:** promoção e validação em produção pendentes.

Estes itens **não** fazem parte das fases de desenvolvimento do Módulo de Vendas.
Não trabalhá-los durante Fases 1+. Só retornar se houver regressão direta causada
pela nova fase, ou na ordem de publicação final.

## Lista

1. **Promoção do artefato imutável** do checkpoint (`promote-release.sh` + SHA
   acima) — ver [`../../deploy/release-immutavel-gate0s.md`](../../deploy/release-immutavel-gate0s.md).
2. **Aplicação das migrations HS-04 e HS-05** em produção (no promote, após backup
   e preflight).
3. **Smoke tests de produção** documentados no gate (§4.11 / preflight).
4. **Varredura dos logs históricos** — runbook em
   [`10-observabilidade-e-logs-producao.md`](./10-observabilidade-e-logs-producao.md) §3.
5. **Reenvio das propostas com código legado** (somente após migrate HS-04 e com
   autorização explícita por orçamento/lote).
6. **Fechamento formal do Gate 0S** (checkboxes da §5 de
   [`09-gate-hotfix-seguranca.md`](./09-gate-hotfix-seguranca.md)).

## Ordem antes da publicação final de Vendas

1. promover e validar o checkpoint do Gate 0S;
2. concluir a varredura histórica e os reenvios autorizados;
3. fechar formalmente o Gate 0S;
4. promover a release do Módulo de Vendas.
