# Fase 2 — RBAC canônico de Vendas (reabertura / revisão)

**Status:** concluída (revisão corrigida; evidências MySQL + Jest abaixo)
**HEAD de partida:** `5a40a965`
**Fora de escopo:** UI, carteira, pipeline, contatos, Gate 0S, deploy, Fase 3.

## Correções da revisão

| Achado | Correção |
|---|---|
| Precedência | `permitido=false` > concessão explícita > piso funcional; função desconhecida nega |
| Cache | **sem cache** nesta fase (consulta ao banco a cada `pode`) |
| Bypass admin | só `usuario_funcao.ADMINISTRADOR`; removido bypass por nome de perfil |
| Seed | colisão `sistema=false` aborta; não reativa inativo; transação por loja |
| Enforcement | `assertPode` em links (criar/atualizar/remover), chat, cálculo, anexos, mutações orçamento |

## Política de precedência

1. Usuário inexistente / outra loja / inativo → nega (tenant).
2. `usuario_funcao.ADMINISTRADOR` → bypass (tenant/ativo já aplicados).
3. Negação explícita em perfil ativo → nega (vence o piso).
4. Concessão explícita em perfil ativo → concede.
5. Sem decisão explícita → piso por função (`VENDAS`/`FINANCEIRO`/…); desconhecida → [].

## Diferidos (não testados nesta fase)

- Carteira própria/equipe/todos → Fase 4+
- Escopo equipe do gestor → Fase 4+
- Aditivo precificar/abonar → Fase 5–6+

## Evidências

- [auditoria-pre-seed.md](./auditoria-pre-seed.md)
- [evidencia-seed-mysql.md](./evidencia-seed-mysql.md)
- [evidencia-rbac-mysql.md](./evidencia-rbac-mysql.md)
- [mapeamento-user-role.md](./mapeamento-user-role.md)
- [matriz-endpoints.md](./matriz-endpoints.md)
