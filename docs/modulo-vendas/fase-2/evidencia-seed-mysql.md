# Evidência — seed M2.1 duas vezes (MySQL real)

**Gerado:** 2026-08-04T21:38:55.668Z  
**Script:** `backend/scripts/seed-vendas-rbac-duas-vezes.ts`  
**Ambiente:** XAMPP MariaDB / `comunikapp`

```json
{
  "primeira": {
    "lojas": 1,
    "perfis_criados": 4,
    "perfis_atualizados": 0,
    "permissoes_upsert": 24,
    "vinculos_criados": 1,
    "pulados": 0,
    "sem_associacao": 0
  },
  "segunda": {
    "lojas": 1,
    "perfis_criados": 0,
    "perfis_atualizados": 4,
    "permissoes_upsert": 24,
    "vinculos_criados": 0,
    "pulados": 1,
    "sem_associacao": 0
  },
  "idempotente": true
}
```

Segunda execução: zero perfis/vínculos novos; permissões upsert sem reabrir
`permitido=false` (update vazio). Relatório sem e-mail/senha/token.
