# Matriz endpoint × permissão (Fase 2 — pós-revisão)

Escopo de dados: **loja (tenant)**. Carteira/equipe/aditivo = diferidos.
Negação: `403` genérico; recurso de outra loja: `404` sem enumeração.

`assertPode` no service = obrigatório em mutação sensível. Guard = defesa adicional.
**Sem cache** de autorização nesta fase.

## Orçamentos V2

| Operação | Permissão | assertPode service |
|---|---|---|
| Criar / duplicar | `proposta.criar` | sim (`criarOrcamento`) |
| Atualizar / status | `proposta.editar` | sim |
| Excluir | `proposta.excluir` | sim |
| Enviar | `proposta.enviar` | sim |
| Aceite interno | `proposta.aceite.registrar` | sim |
| Chat autenticado (enviar) | `proposta.editar` | sim |
| Simular/salvar chapa | `proposta.editar` | sim |
| Listar/buscar | `proposta.ver` | guard + `loja_id` |
| Públicos catálogo | — | rotas-publicas (Gate 0S) |

## Links V2

| Operação | Permissão | assertPode |
|---|---|---|
| Criar | `proposta.enviar` | sim |
| Atualizar / renovar | `proposta.enviar` | sim |
| Remover / revogar | `proposta.enviar` | sim |
| Listar / métricas | `proposta.ver` | guard + tenant |

## Chat V2

| Operação | Permissão | assertPode |
|---|---|---|
| Enviar mensagem / arquivo | `proposta.editar` | sim |
| Marcar lidas | `proposta.ver` | sim |

## Cálculo V2 / motor

| Operação | Permissão | assertPode |
|---|---|---|
| Calcular orçamento / produto / lote | `proposta.editar` | sim (`IntegracaoMotorService`) |

## Anexos geometria

| Operação | Permissão | assertPode |
|---|---|---|
| Upload / remover | `proposta.editar` | sim |
| Download | `proposta.ver` | guard + tenant no metadado |

## Defaults seed

Só `DEFAULTS_CONCEDIDOS_FASE_2`. Catálogo TS completo sem concessão de carteira/aditivo.
