# Fase 8 — Aceite, pedido confirmado, gates e handoffs

**Status:** Concluída
**Produção / Gate 0S:** não tocados

## Entregas da Fase 8

- `ProcessarAceiteHandoffService` para orquestração transacional de aceite (`aceita` -> `pedido_confirmado`), gravando evidências auditáveis (IP, User-Agent, Nome, Email);
- idempotência transacional protegendo contra cliques duplos e requisições concorrentes sem duplicar cobranças ou Ordens de Serviço;
- gerador CSPRNG seguro `gerador-token-seguro.ts` eliminando o uso de `Math.random()`;
- `RegistrarAceiteDto` tipado com `class-validator` e endpoint `POST /orcamentos-v2/:id/aceite`;
- 4 testes unitários/integrados aprovados e builds de backend e frontend limpos.

Evidência reproduzível: `evidencia-entrega-fase-8.md`.
