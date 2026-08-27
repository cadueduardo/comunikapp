# Diagnóstico — estado real do módulo de Usuários

**Data:** 2026-08-27
**Branch:** `codex/modulo-usuarios-rbac` (empilhada sobre `feat/modulo-vendas` @ `2c4ab146`)
**Método:** inspeção de schema, controllers, services, frontend, seeds e testes.
**Documentação antiga:** tratada como alegação, não como prova.

Legenda: **fato verificado** | **inferência** | **proposta** | **decisão de produto pendente**

## Resumo executivo

O modelo de dados de perfis existe (`perfil_acesso`, `perfil_permissao`, `usuario_perfil`) e o CRUD HTTP de usuários é parcial. O RBAC **global** planejado nos documentos de 2025 **não foi implementado**. Autorização efetiva de verdade vive em Vendas (catálogo + seed + service) e, de forma mais fraca, em Compras/OS/função. A tela de novo perfil ainda usa matriz hardcoded fictícia. Há vulnerabilidades **críticas** de autorização intra-tenant.

A documentação `docs/plano-acao-modulo-usuarios.md` afirma ao mesmo tempo “planejado, nenhuma implementação” e “módulo 100% concluído”. Nenhuma das duas afirmações descreve o código.

## Riscos críticos (contenção na Fase 0)

| ID | Severidade | Achado | Evidência |
|---|---|---|---|
| C1 | Crítico | `GET /usuarios` e `GET /usuarios/:id` exigem só JWT. Qualquer usuário da loja lista colegas. | `usuarios.controller.ts:56-60`, `:118-122` |
| C2 | Crítico | `obter()` devolve o registro Prisma **sem `select`**, incluindo `senha`, `two_factor_secret` e código de e-mail. | `usuarios.service.ts:83-88` |
| C3 | Crítico | CRUD de perfis só com `JwtAuthGuard`. Qualquer autenticado cria/edita/exclui perfil, marca `sistema: true` e grava `modulo`/`acao` livres — isso altera o RBAC efetivo de Vendas/Compras. | `perfis-acesso.controller.ts:19-84`; `perfis-acesso.service.ts:8-12`, `:46-53` |
| C4 | Alto | Criação na UI grava sempre `funcao: 'ADMINISTRADOR'`. | `gestao/novo/page.tsx:37` |
| C5 | Alto | Último administrador só é protegido em `desativar`. `PATCH` de `status`/`funcao` não conta. | `usuarios.service.ts:157-170`; `atualizar` em `:132-140` |
| C6 | Alto | `POST /usuarios/reenviar-codigo` enumera contas (`NotFound` se e-mail não existe). | `usuarios.service.ts:189-193` |
| C7 | Médio | DTOs de perfil são interfaces sem `class-validator`; `atualizar` de usuário usa `dto as any`. | `perfis-acesso.service.ts:8-27`; `usuarios.service.ts:140` |
| C8 | Médio | `ModuleActivationGuard` é fail-open (tabela `loja_modulo` inexistente no Prisma). Perfis nem usam o guard. | `module-activation.guard.ts:27-37`; schema sem `model loja_modulo` |

## Tabela por área

| Área | Evidência | Estado real | Severidade | Gap | Fase |
|---|---|---|---|---|---|
| Schema `usuario` | `schema.prisma:2257-2320` | Há `status`, `ativo`, `email_verificado`, `funcao`, senha opcional. **Não há** `session_version`, `bloqueado_ate`, `tentativas_login`. | Alto | Revogação é só `loja.session_version` (revoga a loja inteira). Dois interruptores (`status` + `ativo`) divergem. | 2 |
| Enums | `schema.prisma:2776-2781`, `:2845-2851` | `usuario_status` e `usuario_funcao` canônicos. `UserRole` TS é legado inerte. | — | Docs antigos falam em Admin/Gerente/Operador/Apontador — **não existem**. | 0 |
| Perfis | `schema.prisma:2631-2674` | `modulo`/`acao` são strings livres. `permitido` default `true`. Unique `[loja_id, nome]`. | Médio | Ausência de linha = não revisada (adequado). Sem versão otimista. Cliente pode setar `sistema`. | 1–3 |
| `sessao` / marketplace | busca no schema | **Não existem** models `sessao`, `loja_modulo`, `modulo`. | Médio | Entitlement não opera. Não substituir por perfil. | fora / dívida |
| Login vs middleware | `lojas.service.ts:315-331`; `jwt-global.middleware.ts:85-127`; `auth.service.ts:87-89` | Login exige `status=ATIVO` + e-mail verificado, **ignora `ativo`**. Middleware exige os três. `validateUser` ignora `ativo`. | Alto | Máquina de estados não unificada. | 2, 4 |
| JWT | `auth.service.ts:42-50`; `jwt-global.middleware.ts:130-137` | Payload: `sub`, `loja_id`, `funcao`, `loja_session_version`. Identidade tem duas formas (`sub` vs `id`). | — | `extrairIdentidadeAutenticada` já normaliza (`decorators.ts:37-51`). Controllers de usuários ainda leem `user.id` cru. | 2 |
| RolesGuard | `auth/decorators/roles.decorator.ts` | `@Roles` é metadata **inerte**. Não há `RolesGuard`. | Alto | Docs antigos marcam permissões granulares como feitas. | 1–2 |
| Vendas RBAC | `vendas-permissoes.ts:13-55`; `vendas-permissions.service.ts:33-90` | Catálogo canônico + deny explícito + grant + piso por função + bypass `ADMINISTRADOR`. Bypass por nome de perfil **já removido**. | — | Agregar sem mudar chaves. Acrescentar `vendas.acessar` sem regressão. | 1, 5 |
| Compras RBAC | `compras-permissions.service.ts:5-19`, `:83-136` | 13 chaves enforced no service. Bypass por **nome** `"ADMINISTRADOR"`. Não honra `permitido=false`. Sem piso. | Médio | Unificar no núcleo; remover bypass por nome (falsificável). | 2, 5 |
| OS / Expedição / Instalação | `os-permissions.guard.ts:116-132`; guards de função | Whitelist de `usuario_funcao`. Chaves `OS.APROVAR_*` em maiúsculas, fora da convenção. | Médio | Catálogo com `.acessar` + enforcement parcial honesto. Não inventar CRUD fictício. | 1, 5 |
| Estoque | `tenant-isolation.middleware.ts` + `EstoqueAccessGuard` pontual | Roles default, não `perfil_permissao`. | Médio | Permissão-base + piso compatível com o acesso atual. | 5 |
| Módulos só JWT | insumos, fornecedores, modelos, catálogo, centros, configurações, arte (fila), dashboard | Qualquer autenticado da loja opera a API. Menu quase sempre visível. | Alto | `.acessar` real no backend; piso temporário por função para não trancar quem já opera. | 5 |
| Frontend usuários | `usuarios/gestao/page.tsx` | Tabela/cards e `ConfirmDialog` existem; ações inline duplicadas; card na página; cores light-only. | Médio | Template AGENTS.md (menu compartilhado, card em `components`, tema). | 4 |
| Frontend perfis | `perfis/novo/page.tsx:18-19` | Matriz `orcamentos/produtos/estoque/compras/pcp` × CRUD. **Salvar não chama API.** | Crítico (produto) | Remover hardcoded; consumir catálogo da API. | 3 |
| Menu | `sidebar-menu.tsx:19-56`; `layout.tsx:44-56`; `HeaderUserMenu.tsx:86-89` | Usuários só no header, sem checagem. Sidebar usa função + `/vendas/acesso`. | Alto | Menu = UX a partir de `.acessar`; API continua sendo a porta. | 5 |
| Seed | `seed-vendas-rbac.ts` | Perfis de sistema de Vendas, idempotente, não reabre `permitido=false`. Sem seed de Compras/usuários. | — | Sync de sistema versionado; customizado nunca ganha grant novo. | 2 |
| Testes do módulo | `usuarios-criar-sem-convite.spec.ts` | Só criação com/sem senha. Sem IDOR, admin, perfil, último admin. | Alto | Suíte obrigatória do prompt. | 2–6 |
| Docs antigas | `plano-acao-modulo-usuarios.md:389-396`; checklist `[x]` | Checkboxes marcados sem evidência. PBI pede CPF/login/setor inexistentes. | — | Reconciliar: este diagnóstico prevalece. | 0, 6 |

## Máquina de estados real do usuário

**Fato verificado:** não há state machine explícita. Campos independentes:

| Campo | Default | Quem muda | Efeito no acesso |
|---|---|---|---|
| `status` | `PENDENTE_VERIFICACAO` | criar com senha → `ATIVO`; desativar → `INATIVO`; PATCH admin pode qualquer enum | Login e middleware exigem `ATIVO` |
| `ativo` | `true` | criar `true`; desativar `false`; PATCH **não** altera | Middleware exige `true`; login **não** lê |
| `email_verificado` | `false` | criar com senha / definir senha inicial → `true` | Login, middleware e `validateUser` exigem `true` |
| `BLOQUEADO` | enum existe | Só via PATCH; não há `POST .../bloquear` | Tratado como “não ATIVO” no login |
| Sessão | JWT + `loja.session_version` | Gestão incrementa a versão da **loja** | Desativar usuário **não** incrementa; JWT segue até o middleware recusar por status/ativo |

**Proposta (não é decisão de produto):** acrescentar `usuario.session_version` aditivo para revogar só aquele usuário em mudança crítica, sem derrubar a loja. Unificar: mutações de ciclo de vida escrevem `status` **e** `ativo` juntos.

## Inventário de módulos funcionais (inclusão/exclusão)

Critério objetivo de **inclusão** (todas verdadeiras):

1. Usuário da loja opera a capacidade (não admin SaaS).
2. Há rota autenticada em `(main)` ou API mutável/consultável por esse usuário.
3. Dá para negar por perfil sem quebrar login, tenant ou o produto inteiro.
4. Não é motor/infra usado por outro módulo.

**Incluir:** `dashboard`, `vendas`, `compras`, `estoque`, `os`, `pcp`, `financeiro`, `expedicao`, `instalacao`, `arte`, `catalogo`, `modelos`, `insumos`, `fornecedores`, `centros-trabalho`, `configuracoes`, `usuarios`.

**Excluir:** prisma, mail, websockets, auth (identidade), admin/platform (`/gestao`), motor-calculo, estimativa-tempo, documentos, mensagens-negociacao, common. `notificacoes` absorvido no dashboard (inbox, sem hub próprio). Legado `orcamentos`/`clientes` no `MODULE_NAV_REGISTRY` mapeiam para `vendas`.

**Inferência:** marketplace/`loja_modulo` não está no Prisma; entitlement **não** pode ser substituído por perfil nesta entrega.

## Compatibilidade Vendas / Compras

- **Fato:** chaves `vendas.*` e `compras.*` já são contrato. Não serão renomeadas.
- **Proposta:** acrescentar `vendas.acessar` e `compras.acessar` ao catálogo. `vendas.acessar` entra no piso das funções que hoje já acessam o módulo (`ADMINISTRADOR` via bypass; `VENDAS` e `FINANCEIRO` via piso F7 / `proposta.ver`). Não tranca PRODUCAO/ESTOQUE que já não acessam o hub.
- **Proposta:** Compras deixa de tratar o **nome** do perfil `"ADMINISTRADOR"` como bypass (falsificável). Bypass permanece só em `usuario_funcao.ADMINISTRADOR`.

Nenhuma destas propostas concede permissão nova a quem hoje não tem; a de Compras **remove** um bypass inseguro. Se um perfil customizado chamado “Administrador” dependia disso, o acesso cai — é correção de segurança, não mudança de produto.

## Decisões de produto NÃO bloqueantes (seguidas)

1. Ausência de linha em `perfil_permissao` = **não revisada** (nega), sem seed de `permitido=false`.
2. Bypass admin = somente `usuario_funcao.ADMINISTRADOR`, nunca o nome do perfil.
3. Módulos hoje abertos a qualquer JWT recebem `.acessar` **enforced** com piso temporário nas cinco funções, para permitir deny explícito sem lockout.
4. Convite sem senha permanece na Gestão (`store_user_invitation`); a loja cria usuário com senha inicial.

Não há decisão bloqueante nesta fase.
