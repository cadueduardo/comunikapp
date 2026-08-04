# Mapeamento de compatibilidade UserRole → usuario_funcao

**Regra:** `usuario_funcao` é a única fonte canônica de autorização em Vendas.
`UserRole` (enum legado / strings do frontend) **não autoriza**. Este mapa só
traduz valores legados para quem ainda os envia em código antigo.

| UserRole (legado) | usuario_funcao | Notas |
|---|---|---|
| `admin` / `ADMIN` | `ADMINISTRADOR` | Bypass comercial no service |
| `vendedor` / `VENDEDOR` | `VENDAS` | Piso = defaults vendedor F2 |
| `gerente` / `GERENTE` / `manager` / `MANAGER` | `VENDAS` | Gestor real = perfil `Gestor de Vendas`, não enum novo |
| `operador` / `OPERADOR` | `PRODUCAO` | Sem acesso comercial por padrão |
| `user` / `USER` / `viewer` / `VIEWER` | `null` | Negar até associação explícita de perfil |

Código: `MAPA_USER_ROLE_PARA_FUNCAO` em
`backend/src/vendas/permissions/vendas-permissoes.ts`.

**Não criar** terceiro vocabulário (ex.: `RoleVendas`).
