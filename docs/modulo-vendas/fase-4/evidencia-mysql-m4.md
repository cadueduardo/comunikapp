# Evidência MySQL 8 — M4.1 a M4.4

**Data:** 2026-08-05
**Engine:** MySQL Community Server **8.4.9** (Oracle)
**Host/porta:** `127.0.0.1:3307` (dedicado; XAMPP MariaDB 10.4 permanece em 3306)
**Banco:** `comunikapp_ci_scratch` (nome com `ci`/`scratch` — descartável)
**Datadir:** `.tmp/mysql8-ci/data` (local, fora do deploy)

## Comprovação do ambiente (antes)

```text
versao=8.4.9
hostname=DESKTOP-FU7LERU
porta=3307
comentario=MySQL Community Server - GPL
banco=comunikapp_ci_scratch
```

## Método

1. `prisma db push` em banco vazio → schema atual sincronizado no MySQL 8.
2. Strip aditivo das estruturas M4 (base representativa **pré-M4**).
3. Aplicação sequencial dos SQL oficiais:
   - `20260805120000_vendas_add_responsavel_comercial_cliente` (M4.1)
   - `20260805120100_vendas_add_participantes_e_transferencia_carteira` (M4.2)
   - `20260805120200_vendas_add_contatos_cliente_e_deduplicacao` (M4.3)
   - `20260805120300_vendas_scope_idempotencia_transferencia` (M4.4)
4. `prisma migrate diff --from-url … --to-schema-datamodel` → **No difference detected** (sem drift).
5. Script `backend/scripts/comprovar-m4-mysql8-scratch.ts` → `TODAS_PROVAS_OK`.

## Por que não `migrate deploy` do zero

A cadeia completa falha em `20251101000100_add_workflow_categories` (FK para
`workflows_os` criada só em migration posterior) — dívida pré-existente já
documentada em `fase-0/09-gate-hotfix-seguranca.md` §2.8. **Não** editamos
migrations aplicadas. A prova M4 usa base representativa + SQL M4 oficiais.

## Provas

| Prova | Resultado |
|---|---|
| Mesma `chave_operacao` em duas lojas | OK (unique composto) |
| Mesma chave na mesma loja | negada (unicidade) |
| CAS concorrente (`updateMany`) | exatamente 1 alteração |
| Rollback transacional | responsável restaurado |
| Drift schema×banco | ausente |

## MariaDB 10.4

Evidência anterior em XAMPP (`evidência histórica`) **não** fecha este requisito.
Esta página é a evidência canônica MySQL 8.
