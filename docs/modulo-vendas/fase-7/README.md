# Fase 7 — Governança de preço, desconto, margem e alçadas

**Status:** Concluída
**Produção / Gate 0S:** não tocados

## Entregas da Fase 7

- `AlcadaComercialService` desambiguado de alçadas operacionais da OS;
- promoção de `rascunho -> aguardando_alcada` via `TransicaoComercialService` quando o desconto excede a alçada permitida do vendedor;
- endpoints e DTO tipado com `class-validator` para listagem e decisão do gestor comercial (`vendas.alcada.aprovar`) com justificativa obrigatória;
- módulo puro de sanitização `sanitizarCustosEMargem` ocultando segredos de composição de custos e margem bruta para perfis sem permissão RBAC;
- interface frontend `AlcadasPendentesDialog` integrada na página de Orçamentos V2;
- 7 testes unitários aprovados e build limpo no backend e frontend.

Evidência reproduzível: `evidencia-entrega-fase-7.md`.
