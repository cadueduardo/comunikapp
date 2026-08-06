# Fase 12 — Migração, observabilidade, rollout e aceite do Mínimo Seguro

**Status:** Concluída (Mínimo Operacional Seguro Lançado)
**Produção / Gate 0S:** não tocados

## Entregas da Fase 12

- `VendasRolloutService` fornecendo preflight de prontidão por loja e telemetria de observabilidade;
- endpoints sob `/vendas/rollout` protegidos por autorização RBAC de gestor/admin;
- 2 testes unitários aprovados (`vendas-rollout.service.spec.ts`);
- compilações de produção de backend (`nest build`) e frontend (`next build`) aprovadas com zero erros;
- marcação formal de conclusão do **Mínimo Operacional Seguro** (RP §14.1 / Fases 0 a 12).

Evidência reproduzível: `evidencia-entrega-fase-12.md`.
