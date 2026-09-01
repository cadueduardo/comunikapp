# Plano de ação — Usuários, Perfis e Permissões

**Base:** `DIAGNOSTICO-ESTADO-REAL.md`
**Branch:** `codex/modulo-usuarios-rbac` → integrar em `feat/modulo-vendas` (nunca direto em `main`).

## MVP desta entrega

1. CRUD seguro de usuários da loja (listar, detalhar, criar com função escolhida, editar, inativar/reativar, senha, último admin, anti-autoelevação).
2. CRUD seguro de perfis dirigido pelo **catálogo da API**.
3. Catálogo automático: cada módulo funcional declara um manifesto; agregador + gate de CI.
4. Permissão-base `<modulo>.acessar` aplicada no backend (ou exceção temporária explícita).
5. Núcleo único de permissão efetiva (deny-by-default, múltiplos perfis, deny explícito, não revisada).
6. Vendas e Compras agregados **sem** renomear chaves.
7. Template CRUD desktop/mobile do `AGENTS.md`.

## Rollout e compatibilidade com `usuario_funcao`

| Camada | Durante esta entrega | Depois (dívida) |
|---|---|---|
| Identidade | Continua `usuario_funcao` no JWT | — |
| Bypass admin | Só `ADMINISTRADOR` | — |
| Vendas granular | `VendasPermissionsService` inalterado na precedência; passa a consultar o núcleo ou permanece equivalente testada | Piso F7 pode ser reduzido quando perfis de sistema cobrirem 100% |
| Demais módulos | `.acessar` + piso por função igual ao acesso **atual** | Trocar piso por grants de perfil |
| Menu | Consome `GET /usuarios/me/acesso` (avaliação de `.acessar`) | — |

Função legada **não** some. Perfil granular **soma**. Perfil inativo não concede. Customizado **não** recebe grant novo no sync.

## Ordem das fases

### Fase 0 — Diagnóstico e contenção

- Documentos canônicos em `docs/modulo-usuarios/`.
- Corrigir C1–C7: listar/obter usuários só admin; resposta sem segredos; perfis só admin; DTO com class-validator; `sistema` não vem do cliente; último admin também no PATCH; enumeração no reenvio de código.

### Fase 1 — Catálogo automático

- Tipos `ModuloCatalogo` / `PermissaoCatalogo`.
- `*.catalogo.ts` junto de cada domínio + agregador que **importa** os manifestos (registro no container; bundler Nest não faz glob confiável em runtime).
- Gate de CI: módulo funcional sem manifesto, manifesto órfão, chave duplicada, chave enforced ausente do catálogo.
- API `GET /usuarios/perfis/catalogo` (rota estática antes de `/:id`).
- Frontend **não** duplica a lista de módulos.

### Fase 2 — Núcleo de autorização

- `PermissaoEfetivaService` com o algoritmo de `MODELO-AUTORIZACAO-EFETIVA.md`.
- `usuario.session_version` + checagem no middleware (tokens antigos sem o campo = 0).
- `perfil_acesso.versao` (concorrência otimista).
- `loja_audit_log` sanitizado.
- Sync idempotente de perfis de sistema (não toca decisão customizada).
- Transação em substituição de permissões.

### Fase 3 — CRUD de perfis

- Backend paginado, DTOs, auditoria, confirmação de risco CRITICO, associação tenant-safe.
- UI: template tabela/cards; matriz gerada pelo catálogo; estados concedida / negada / não revisada.

### Fase 4 — CRUD de usuários

- Remover ADMINISTRADOR hardcoded na criação.
- Seleção de função e perfis; reativar; revogar sessão; template CRUD.

### Fase 5 — Rollout `.acessar`

- Guard de prefixo de API por manifesto.
- Menu a partir da API de acesso.
- **URL direta:** o layout autenticado recusa a página se `.acessar` for falso
  (`ModuleAccessGate`). A API recusa no `ModuloAcessoGuard` (403).
  Exceção: `/configuracoes` só para 2FA da própria conta.
- Isolamento com duas lojas nos testes.
- Enforcement parcial visível na UI (OS, PCP, etc.).

### Fase 6 — Consolidação

- Remover matriz hardcoded e caminhos inertes.
- Reconciliar docs antigas.
- Validação final, typecheck, testes, `git diff --check`.
- PR `codex/modulo-usuarios-rbac` → `feat/modulo-vendas`.

## Fora de escopo (reafirmado)

- Permissões CRUD fictícias.
- Marketplace/`loja_modulo` (não criar tabela especulativa).
- Permissão customizada por usuário avulso.
- JWT de loja na Gestão `/gestao`.
- Alterar regras de alçada comercial/financeira de Vendas.
- Marcar fases de Vendas/Compras como concluídas.

## Dívidas desta entrega

Ver tabela em `EVIDENCIAS-DE-VALIDACAO.md`. Principais: entitlement `loja_modulo` fora de escopo; módulos com enforcement parcial continuam no piso de `usuario_funcao` até o domínio aplicar granulares.
