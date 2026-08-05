# Evidência — Fase 4

**Data:** 2026-08-05
**HEAD inicial (code review):** `7657ec34548291c0d0e425e799fea9cb2a28d1b3`
**Gate 0S:** congelado
**Produção / deploy / Fase 5:** não executados

## Pendências do review — fechadas

| Item | Evidência |
|---|---|
| A — Gestão de participantes | API `GET/POST/DELETE /clientes/:id/participantes` + painel na ficha |
| B — Rollout clientes legados | `docs/modulo-vendas/fase-4/rollout-clientes-legados.md` + dry-run script |
| C — MySQL 8 | `evidencia-mysql-m4.md` (8.4.9 / `comunikapp_ci_scratch`:3307) |
| D — Testes adicionais | suite carteira 51 testes (concorrência, isolamento, participantes, legado) |

## Modelo de participantes

- Tabela `cliente_participante` (M4.2).
- Administração exige `CARTEIRA_TRANSFERIR` (gestor/admin no seed).
- Elegível: mesma loja, ativo, status ATIVO, função VENDAS|ADMINISTRADOR.
- Responsável principal não pode ser duplicado como participante.
- Inclusão idempotente; remoção auditada (evento comercial sanitizado).
- Participante vê na carteira própria; **não** recebe transferência/inativação/alcada.
- Transferência remove o destino da lista de participantes (DV-11).

## Estratégia legados

- Sem atribuição automática.
- Escopo `sem_responsavel` para gestor/admin.
- Dry-run: `scripts/carteira-rollout-legado-dry-run.ts` (contagens + refs hash).
- `legado=1` só muda formato; mantém escopo de carteira.

## Checklist do plano §8

| Item | Evidência |
|---|---|
| D-06 / M4.1–M4.4 | MySQL 8 + schema |
| Participantes API/UX | controller + `ParticipantesCarteiraPanel` |
| Paginação servidor | inalterada |
| Template Fornecedores | inalterado (tabela desktop / cards mobile) |
| Transferência CAS + idempotência por tenant | service + testes |
| Mesclagem / redistribuição auto / ficha 360 completa | diferidos |

## Gate RP 8.8

Mantido; ver entrega anterior + participantes na ficha.

## Testes

Ver `evidencia-testes-fase-4.md` e `evidencia-mysql-m4.md`.
