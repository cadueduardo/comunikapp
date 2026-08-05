# Evidência — Fase 4

**Data:** 2026-08-05
**Implementação auditada:** `e5992b04bffe46d0a05a5607d3bbb28ad542773d`
**HEAD inicial:** `b1c59dd6dfe099023915e61b69ded682d023cf7d`
**Gate 0S:** congelado
**Produção / deploy:** não executados

## Correções do code review

- M4.4 torna `chave_operacao` única por `loja_id`, sem editar a M4.2 aplicada.
- Transferência usa compare-and-set transacional e não sobrescreve alteração concorrente.
- Corrida com a mesma chave é tratada como idempotência.
- Logs de transferência usam referências pseudonimizadas.
- Destinos são obtidos por endpoint mínimo e limitados a usuários ativos
  `VENDAS` ou `ADMINISTRADOR` da mesma loja.
- Alertas de duplicidade não devolvem ID nem nome de outro cliente.

## Gate ainda aberto

- O modelo de participantes existe e participa do escopo, mas não há operação
  autorizada de inclusão/remoção nem UX correspondente.
- Clientes anteriores à M4.1 permanecem sem responsável; falta plano de atribuição.
- A evidência disponível é MariaDB 10.4, não MySQL 8.

## Checklist do plano §8 — evidência

| Item | Evidência |
|---|---|
| D-06 / M4.1–M4.3 | Migrations aplicadas; schema com `responsavel_comercial_id`, participantes, transferência, contatos, normalizados |
| Nome inequívoco | Comentários Prisma + UI “Responsável comercial” vs “Contato no cliente” |
| Sem `@@unique` em normalizados | Só `@@index([loja_id, *])` |
| Paginação servidor | `ListarClientesQueryDto` + `take`/`skip`; UI `enablePagination={false}` |
| Template Fornecedores | `ClientesCarteiraListagem` default `table`; mobile cards; menu compartilhado |
| `/vendas/carteira` | `frontend/src/app/(main)/vendas/carteira/page.tsx` |
| Alias `/clientes` | mesma listagem + `VendasAccessGate` |
| Transferência + histórico | `transferirCarteira` em `$transaction` + `chave_operacao` |
| Contatos | CRUD `/clientes/:id/contatos` |
| Mesclagem | `mesclar` → Forbidden (diferido) |
| Redistribuição ao inativar vendedor | Diferido operacional (transferência manual coberta); sem hook no fluxo de inativação de usuário |
| Ficha 360 completa (atividades/pedidos/aditivos) | Parcial: contatos + transferências + orçamentos/OS; atividades = Fase 5 |

## Gate RP 8.8

| # | Critério | Evidência |
|---|---|---|
| 27 | Clientes na nav Vendas | `vendasModuleNav` + alias |
| 28 | Default Minha carteira | `escopoInicial="propria"` |
| 29 | Gestor alterna escopos | Select de escopo filtrado por `/vendas/acesso` |
| 30–31 | Contatos / responsável | API + ficha |
| 32 | Transferência auditada | histórico + SEC_EVT |
| 33 | Inativação não apaga | soft `ativo`/`status` |
| 34 | Paginação servidor | listar paginado |

## Testes

Ver `evidencia-testes-fase-4.md` e `evidencia-mysql-m4.md`.
