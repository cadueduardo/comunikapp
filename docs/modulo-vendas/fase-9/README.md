# Fase 9 — Aditivos comerciais e OS Aditiva

**Status:** Concluída
**Produção / Gate 0S:** não tocados

## Entregas da Fase 9

- `AditivosComerciaisService` integrando a decisão comercial de Vendas ao `InstalacaoSplitFinanceiroService`;
- precificação comercial e abono com autorização RBAC (`vendas.aditivo.precificar` e `vendas.alcada.aprovar`);
- consolidação de ocorrências e geração de OS Aditiva vinculada (`os_pai_id`) sem alterar a OS principal;
- endpoints dedicados sob `/vendas/aditivos` em `AditivosVendasController`;
- interface frontend `/vendas/aditivos` com visualização tabular no desktop e cards no mobile;
- 4 testes unitários aprovados e builds de backend e frontend limpos.

Evidência reproduzível: `evidencia-entrega-fase-9.md`.
