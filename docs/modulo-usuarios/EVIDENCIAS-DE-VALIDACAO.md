# Evidências de validação — módulo de Usuários

Atualizado ao final de cada fase. Comandos reais do repositório (nunca `npm test` sem filtro).

## Git / isolamento

| Item | Evidência |
|---|---|
| Working tree original | `C:\Projects\comunikapp` em `feat/modulo-vendas` @ `2c4ab146`, WIP de Arte/OS/Cloudflare **preservado** |
| Worktree de Usuários | `C:\Projects\comunikapp-usuarios` branch `codex/modulo-usuarios-rbac` |
| Base | `feat/modulo-vendas` (não `main`) |
| Prompt copiado | SHA-256 idêntico ao original; primeiro commit documental `604e7bf9` |

## Fase 0

- [x] Diagnóstico e plano canônicos commitados
- [x] GET `/usuarios` e GET `/usuarios/:id` negam não-admin
- [x] `obter` não devolve senha/secret/código
- [x] CRUD de perfis nega não-admin
- [x] Cliente não define `sistema`
- [x] Reenvio de código não enumera conta
- [x] Testes de contenção

### Comandos (Fase 0)

```text
npx jest src/usuarios/usuarios-criar-sem-convite.spec.ts src/usuarios/usuarios-contencao.spec.ts src/usuarios/perfis-acesso.contencao.spec.ts --runInBand --forceExit --no-coverage
```

## Fase 1

- [x] Manifestos de todos os módulos do inventário
- [x] API de catálogo
- [x] Gate de CI no workflow e em teste Jest

## Fase 2

- [x] Algoritmo único coberto (admin, deny, grant, não revisada, perfil inativo, multi-perfil, desconhecida, cross-tenant)
- [x] session_version do usuário
- [x] Sync idempotente sem grant novo em customizado

## Fase 3–4

- [x] CRUD perfis/usuários + template visual (`UsuarioCard`/`PerfilCard`, tabela desktop, cards no mobile)
- [x] Sem matriz hardcoded (catálogo da API + `MatrizPermissoesPerfil`)
- [x] Paginação tenant-safe e associação de perfis
- [x] Confirmação para permissão crítica
- [x] Auditoria sanitizada nas mutações

## Fase 5–6

- [x] `.acessar` no backend via `ModuloAcessoGuard` (prefixos do manifesto)
- [x] Menu a partir de `GET /usuarios/me/acesso`
- [x] Duas lojas no `PermissaoEfetivaService`
- [x] Compras unificado no núcleo (sem bypass por nome de perfil)
- [x] OpenAPI: `@ApiTags` em usuários/perfis
## Correção da revisão (login, catálogo, sync, mutações)

Evidência local (worktree `C:\Projects\comunikapp-usuarios`, heap 6144):

```text
npx ts-node --transpile-only scripts/gerar-agregador-catalogo-rbac.ts --check
npx jest src/auth/auth.service.spec.ts src/lojas/lojas.service.login-session.spec.ts src/common/middleware/jwt-global.middleware.spec.ts src/usuarios/usuarios-contencao.spec.ts src/usuarios/usuarios-criar-sem-convite.spec.ts src/usuarios/perfis-acesso.contencao.spec.ts src/rbac/catalogo/catalogo.gate.spec.ts src/rbac/autorizacao/permissao-efetiva.service.spec.ts src/rbac/sync/sincronizar-perfis-sistema.service.spec.ts src/compras/services/compras-permissions.service.spec.ts src/vendas/permissions/vendas-permissions.service.spec.ts src/vendas/permissions/seed-vendas-rbac.spec.ts src/rbac/autorizacao/modulo-acesso.guard.spec.ts --runInBand --forceExit --no-coverage
```

Resultado: 13 suites / 71 testes passando; agregador gerado sincronizado (17 manifestos); `git diff --check` limpo.

- [x] Login passa `session_version` real ao JWT (`lojas.service.login-session.spec.ts`)
- [x] Token recém-emitido autorizado; token sem/versão antiga revogado
- [x] Gate compara filesystem `(main)`, `*.catalogo.ts` com `manifestoAcessoModulo` e chaves enforced
- [x] Sync de sistema cria só grants ausentes, não reabre deny, não toca customizado
- [x] Autoelevação, último admin com `FOR UPDATE`, reset com `updateMany` atômico
- [x] `ComprasModule` importa `RbacCoreModule` (sem registrar `APP_GUARD` de novo)
- [x] typecheck/build e checks obrigatórios do PR: run `33090577207` (PR) e `33090572044` (push) **success** — lint/build, unitários, e2e, Gate 0S, Prisma, OpenAPI, audit, artefato. Build e Deploy permanece skip fora da `main`.

## Dívidas remanescentes

| Dívida | Risco | Proprietário | Condição de saída |
|---|---|---|---|
| `loja_modulo`/marketplace ainda não existe; entitlement da loja não entra no núcleo | Médio | Plataforma | Tabela real + guard fail-closed, sem inventar schema agora |
| Módulos OS/PCP/Arte etc. com `statusEnforcement: PARCIAL` (piso por função) | Médio | Dono do módulo | Substituir piso por grants de perfil quando o domínio aplicar granulares |
| `prisma generate` não rodado no worktree (junction com o original) | Baixo em CI | CI | Job de CI já executa `prisma generate` + `db push` |
| Integração em `feat/modulo-vendas` por PR (working tree de Vendas sujo) | Operacional | Agente/dev | PR `codex/modulo-usuarios-rbac` → `feat/modulo-vendas`; não mergear na `main` |

## Suites que não podem regressar

```text
npx jest src/vendas/permissions/vendas-permissions.service.spec.ts --runInBand --forceExit --no-coverage
npx jest src/vendas/permissions/seed-vendas-rbac.spec.ts --runInBand --forceExit --no-coverage
npx jest src/common/middleware/jwt-global.middleware.spec.ts --runInBand --forceExit --no-coverage
npx jest src/rbac/catalogo/catalogo.gate.spec.ts src/rbac/autorizacao/permissao-efetiva.service.spec.ts --runInBand --forceExit --no-coverage
```
