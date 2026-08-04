# Evidência — auditoria RBAC pré-M2.1 (MySQL real)

**Gerado:** 2026-08-04T21:38:29.203Z
**Script:** `backend/scripts/auditar-rbac-vendas.ts`  
**Ambiente:** XAMPP MariaDB 10.4.32 (`127.0.0.1:3306` / `comunikapp`)

## Resultado sanitizado

```json
{
  "usuarios": {
    "total": 1,
    "ativos": 1,
    "ativos_sem_perfil": 1,
    "por_funcao": { "ADMINISTRADOR": 1 },
    "funcoes_fora_do_enum": 0
  },
  "perfis": [],
  "permissoes_vendas": { "total": 0, "por_acao": {} },
  "colisoes_perfil_modulo_acao": [],
  "colisoes_nome_perfil_sistema": [],
  "lojas": [
    {
      "loja_id": "tisruw9j7",
      "slug": "cortetotal",
      "usuarios": 1,
      "perfis": 0
    }
  ]
}
```

## Interpretação

- 1 loja ativa; 1 administrador sem perfil → seed deve criar perfis sistema e vincular Admin.
- Sem colisões de nome nem duplicatas `(perfil, modulo, acao)`.
- Sem funções fora do enum.
