# Evidência — integração MySQL VendasPermissionsService

**Gerado:** 2026-08-04

**Script:** `backend/scripts/validar-rbac-vendas-mysql.ts`
**Ambiente:** XAMPP MariaDB / `comunikapp`

```json
{
  "ok": true,
  "resultados": {
    "admin_excluir": true,
    "vendedor_enviar_antes": true,
    "vendedor_enviar_apos_revoga": false,
    "vendedor_inativo": false,
    "admin_outra_loja": false,
    "assert_inativo_lanca": true
  }
}
```

Cobertura: bypass admin com tenant; piso VENDAS; revogação `permitido=false`
sobre piso (sem cache); usuário inativo; assertPode no service; outra loja negada.
Usuário temporário removido ao final; permissão do perfil Vendedor restaurada.
