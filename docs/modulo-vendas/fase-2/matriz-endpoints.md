# Matriz endpoint × permissão (Fase 2)

Escopo de dados nesta fase: **loja (tenant)** — carteira própria/equipe/todos
fica para Fase 4+. Resposta de negação: `403` com mensagem genérica
(“Você não tem permissão…”); recurso de outra loja: `404` onde aplicável
(sem enumeração).

`assertPode` no service = mutação sensível. Leituras cobertas pelo
`VendasPermissionsGuard` + filtro `loja_id`.

## Orçamentos V2 (`OrcamentosV2Service` / controller)

| Método / rota (resumo) | Permissão | Escopo | Tenant | assertPode no service | +/- testes |
|---|---|---|---|---|---|
| POST criar | `proposta.criar` | loja | `loja_id` JWT | sim | service permissions |
| GET listar / buscar / histórico | `proposta.ver` | loja | `loja_id` | guard | service + IDOR loja |
| PUT/PATCH atualizar | `proposta.editar` | loja | `loja_id` | sim | service |
| DELETE remover | `proposta.excluir` | loja | `loja_id` | sim | vendedor− gestor+ |
| POST alterar status | `proposta.editar` | loja | `loja_id` | sim | service |
| POST enviar | `proposta.enviar` | loja | `loja_id` | sim | service |
| POST aceite interno / fechar pedido | `proposta.aceite.registrar` | loja | `loja_id` | sim | aceite-publico mocks |
| Rotas `@Public` aceite/cliente | — (catálogo público) | token link | n/a JWT | n/a | Gate 0S / rotas-publicas |

## Links V2

| Operação | Permissão | Escopo | Tenant | assertPode | +/- |
|---|---|---|---|---|---|
| Criar link | `proposta.enviar` | loja | `orcamento.loja_id` | sim (`LinksV2Service`) | permissions + IDOR |
| Listar / ver / métricas | `proposta.ver` | loja | `loja_id` | guard | IDOR findFirst |
| Revogar / renovar | `proposta.enviar` | loja | `loja_id` | guard | — |

## Chat / cálculo / impressão / anexo geometria / produto detalhes

| Superfície | Ver | Editar | Tenant | assertPode service | Guard |
|---|---|---|---|---|---|
| Chat V2 | `proposta.ver` | `proposta.editar` | `loja_id` | guard | sim |
| Cálculo V2 | `proposta.ver` | `proposta.editar` | `loja_id` | guard | sim |
| Impressão V2 | `proposta.ver` | — | `loja_id` | guard | sim |
| Anexo geometria | `proposta.ver` | `proposta.editar` | `loja_id` | guard | sim |
| Produto detalhes | `proposta.ver` | — | `loja_id` | guard | sim |

## Defaults concedidos (seed)

Ver `DEFAULTS_CONCEDIDOS_FASE_2`. Catálogo TS inclui carteira/pipeline/etc. **sem**
concessão nesta fase.
