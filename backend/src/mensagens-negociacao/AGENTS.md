# mensagens-negociacao — DESCONTINUADO (Fase 1 / DV-15)

**Contrato canônico de chat comercial:** `MensagemChat` via
`orcamentos-v2` (`ChatV2Service` / rotas `/orcamentos-v2/.../mensagens` e
`/orcamentos-v2/.../chat/...`).

## Auditoria de consumidores (2026-08-04) — escritas com 410 Gone

| Superfície | Resultado |
|---|---|
| Frontend (`frontend/src`) | Nenhum `fetch`/`apiRequest` para `/orcamentos/:id/mensagens` (sem `v2`). Chat ativo usa `/orcamentos-v2/.../mensagens` e `/orcamentos-v2/.../chat/...`. |
| BFF (`frontend/src/app/api`) | Sem proxy para `mensagens-negociacao`. |
| Backend callers | Apenas o próprio módulo + registro em `app.module.ts`. |
| Testes | `rotas-publicas.spec.ts` cobre só **GET** `/orcamentos/orc1/mensagens/publico` (não-público efetivo). |
| OpenAPI | Paths `/orcamentos/{orcamentoId}/mensagens*` documentados; POSTs de criação/anexo marcados como descontinuados (410). |
| Integração externa conhecida | Nenhuma (sem webhook/SDK/parceiro referenciando esta rota no repositório). |

**Conclusão:** superfície de **escrita** órfã → `410 Gone` mantido.
**Leitura** (GET listagem / não-visualizadas) preservada para histórico legado.
**Não** há adaptador para `MensagemChat` nas escritas porque não há consumidor.
**Não** há terceiro chat.

## Comportamento

| Método | Rota | Resposta |
|---|---|---|
| GET | `.../mensagens`, `.../publico`, `.../nao-visualizadas*` | 200 (legado, autenticado) |
| POST | criar / criar público / anexo | **410 Gone** |
| POST | marcar visualizada | mantido (não cria mensagem) |

Remoção de tabela/endpoints: migration futura após `SELECT COUNT(*)` em produção.
