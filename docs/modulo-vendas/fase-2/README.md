# Fase 2 — RBAC canônico de Vendas

**Status:** concluída (evidência abaixo)  
**HEAD de partida:** `5a40a965`  
**Fora de escopo:** UI, carteira, pipeline, contatos, Gate 0S, deploy.

## Inventário reutilizado (não refeito)

| Peça | Caminho |
|---|---|
| Service + cache | `backend/src/vendas/permissions/vendas-permissions.service.ts` |
| Catálogo + defaults F2 | `backend/src/vendas/permissions/vendas-permissoes.ts` |
| Guard HTTP (defesa adicional) | `vendas-permissions.guard.ts` + `@RequerPermissaoVendas` |
| Módulo | `backend/src/vendas/vendas-security.module.ts` |
| Rotas públicas (única fonte) | `backend/src/common/security/rotas-publicas.ts` + `RotasPublicasValidator` |
| IDOR links | `links-v2.service.ts` filtra `loja_id` |

**Proibido mantido:** RolesGuard global; `@Roles` como autorização.

## Fonte canônica de papel

- `usuario_funcao` autoriza (piso + perfil).
- `UserRole` é legado — ver [mapeamento-user-role.md](./mapeamento-user-role.md).
- Gestor = `usuario_funcao.VENDAS` + perfil sistema `Gestor de Vendas` (sem terceiro enum).

## Auditoria pré-seed (M2.0)

Script: `backend/scripts/auditar-rbac-vendas.ts`.

| Ambiente | Resultado |
|---|---|
| Local (2026-08-04) | MySQL `127.0.0.1:3306` indisponível — relatório real **pendente de execução** no ambiente com DB. Script pronto e sanitizado (sem e-mail/segredo). |

Ao subir o DB: `npx ts-node scripts/auditar-rbac-vendas.ts` a partir de `backend/`.

## Seed M2.1

- `backend/prisma/seed-vendas-rbac.ts` ligado em `seed.ts`.
- Idempotente; não remove customizações; `update: {}` não reabre `permitido=false`.
- Defaults = só `DEFAULTS_CONCEDIDOS_FASE_2` (catálogo completo no TS; carteira/etc. sem concessão nesta fase).
- Vendedor sem financeiro; produção/estoque/função desconhecida sem vínculo comercial.
- Relatório sanitizado (ids + motivos).

## Enforcement

Mutações sensíveis com `assertPode` no service:

- `OrcamentosV2Service`: criar, editar, excluir, alterar status, enviar, aceite interno.
- `LinksV2Service.criarLinkPublico`: `proposta.enviar`.
- Controllers: guard + `@RequerPermissaoVendas` (nunca única prova).
- Leituras/listagens: guard HTTP + filtro `loja_id` (tenant).

Matriz endpoint × permissão: [matriz-endpoints.md](./matriz-endpoints.md).

## Regressão Gate 0S

- IDOR links: permanece com `loja_id` em findFirst.
- Fonte única de rota pública: inalterada; validator na boot.
- Sem alteração em scripts de deploy, observabilidade ou aceite público.

## Testes (Jest filtrado)

```text
npx jest src/vendas/permissions/vendas-permissions.service.spec.ts --runInBand --forceExit --no-coverage
npx jest src/vendas/permissions/seed-vendas-rbac.spec.ts --runInBand --forceExit --no-coverage
npx jest src/common/security/rotas-publicas.validator.spec.ts --runInBand --forceExit --no-coverage
```

Cobertura: vendedor/gestor/financeiro/admin; sem perfil; inativo; função desconhecida; dois tenants; concede/revoga; cache; ID outra loja; frontend ≠ auth; seed idempotente.
