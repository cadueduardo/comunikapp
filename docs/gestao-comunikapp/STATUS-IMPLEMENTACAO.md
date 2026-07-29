# Status de implementação — Gestão ComunikApp

**Última atualização:** 29/07/2026  
**Estado:** fundação administrativa e fundação editorial implementadas; ambiente
local validado pelo proprietário do produto.

Este documento é o ponto de retomada técnica para qualquer novo agente. Ele não
substitui o [RP funcional](./RP-gestao-administrativa-comunikapp.md), mas registra
o que já existe no código, o que foi validado e o que ainda falta.

## 1. Leitura obrigatória antes de continuar

1. `AGENTS.md`, na raiz do repositório;
2. `docs/gestao-comunikapp/RP-gestao-administrativa-comunikapp.md`;
3. este documento;
4. `docs/database/boas-praticas-schema-prisma.md`;
5. para alterações em módulos, `docs/arquitetura-modulos.md`.

Regras críticas já consolidadas:

- identidade administrativa separada da identidade das lojas;
- autorização negada por padrão e sempre aplicada no backend;
- isolamento multi-tenant derivado da identidade autenticada;
- migrations aditivas no schema Prisma canônico;
- auditoria sanitizada para toda mutação sensível;
- componentes reutilizáveis globais, sem CSS inline;
- responsividade, dark mode, light mode e UTF-8 com português do Brasil;
- não duplicar componentes, clientes HTTP, formatadores ou regras de negócio.

## 2. Estado validado

### Ambiente local

- `backend/.env` contém chaves locais exclusivas para JWT administrativo, 2FA e
  webhook de deploy. O arquivo está ignorado pelo Git.
- As 107 migrations existentes estão aplicadas no banco MySQL local.
- As migrations administrativas foram aplicadas localmente:
  - `20260729100000_add_gestao_admin_foundation`;
  - `20260729150000_add_product_updates`.
- O bootstrap inicial foi executado.
- O primeiro `SUPER_ADMIN` concluiu o convite, configurou a senha e o 2FA.
- Login e acesso à Gestão foram confirmados manualmente em
  `http://localhost:3000/gestao`.

### Produção

- Nenhuma migration desta entrega foi aplicada em produção por este trabalho.
- Nenhum segredo de produção foi criado ou configurado.
- Nenhum deploy de produção foi executado.
- Antes do deploy, usar o preflight, backup e processo de migrations descritos
  na documentação de banco.

## 3. Fundação administrativa implementada

### Identidade, autenticação e sessão

Modelos:

- `admin_user`;
- `admin_session`;
- `admin_invitation`;
- `admin_audit_log`.

Características:

- JWT administrativo com segredo diferente de `JWT_SECRET`;
- cookie `comunikapp_admin_session`, HttpOnly e host-only;
- sessão persistida, curta, revogável e com expiração;
- validação da sessão no banco a cada autenticação;
- bloqueio temporário após cinco tentativas inválidas;
- comparação de senha com hash dummy para reduzir enumeração por timing;
- respostas genéricas para credenciais inválidas;
- 2FA TOTP obrigatório para `SUPER_ADMIN`;
- segredo TOTP criptografado com AES-256-GCM;
- logout revoga a sessão no banco.

Arquivos centrais:

- `backend/src/admin/admin-auth.service.ts`;
- `backend/src/admin/admin-jwt.strategy.ts`;
- `backend/src/admin/admin-boundary.guard.ts`;
- `backend/src/admin/admin-session-cookie.ts`;
- `backend/src/admin/admin-two-factor.service.ts`.

### RBAC

Perfis existentes:

- `SUPER_ADMIN`;
- `OPERACAO`;
- `SUPORTE`;
- `FINANCEIRO_SAAS`;
- `ANALISTA`.

Permissões implementadas:

- `ADMIN_MANAGE`;
- `AUDIT_READ`;
- `STORE_READ`;
- `STORE_STATUS_CHANGE`;
- `PRODUCT_UPDATE_READ`;
- `PRODUCT_UPDATE_WRITE`;
- `PRODUCT_UPDATE_PUBLISH`.

Matriz atual:

- `SUPER_ADMIN`: todas as permissões;
- `OPERACAO`: leitura e status de lojas; leitura e edição de novidades; leitura de
  auditoria;
- `SUPORTE`, `FINANCEIRO_SAAS` e `ANALISTA`: leitura de lojas, novidades e
  auditoria;
- publicação de novidades: somente `SUPER_ADMIN`;
- `ANALISTA`: IP e user-agent da auditoria são mascarados.

O `AdminBoundaryGuard` protege por padrão todo o namespace `/admin/v1`. Rotas
públicas nesse namespace precisam de `@AdminPublic()` e de uma proteção própria,
como ocorre no webhook de deploy.

### Convites administrativos

Implementado:

- criar convite por nome, e-mail e perfil;
- token aleatório armazenado somente como hash;
- validade inicial de 72 horas;
- aceitar convite e definir a própria senha;
- exigir configuração de 2FA quando aplicável;
- listar, reenviar e cancelar;
- reenvio invalida o token anterior;
- falha de envio não perde o convite e é auditada;
- bootstrap inicial sem senha fixa:

```bash
cd backend
npm run admin:bootstrap -- --name "Nome completo" --email "email@dominio.com"
```

Também implementado (administradores ativos — 29/07/2026):

- `GET/PATCH /admin/v1/administrators` (somente `ADMIN_MANAGE`);
- listar com busca, filtro por status/perfil e paginação;
- alterar perfil; inativar/reativar com justificativa;
- revogar sessões ao inativar ou mudar perfil;
- proteção do último `SUPER_ADMIN` ativo (não rebaixa/inativa);
- reautenticação por senha atual ao promover a `SUPER_ADMIN`;
- não permite inativar a própria conta;
- auditoria `ADMIN_ROLE_CHANGED`, `ADMIN_INACTIVATED`, `ADMIN_REACTIVATED`;
- UI em `/gestao/administradores` com abas Ativos | Convites (CRUD
  tabela/cards no padrão fornecedores).

## 4. Gestão de lojas implementada

Implementado:

- lista com busca, filtro por status e paginação no servidor;
- detalhe básico;
- mascaramento de e-mail/documento para `ANALISTA`;
- contagens de usuários, clientes, orçamentos e OS no detalhe;
- ativação, inativação e bloqueio;
- transições de status validadas no backend;
- justificativa e categoria obrigatórias;
- bloqueio reservado ao `SUPER_ADMIN`;
- transação contendo alteração e auditoria;
- incremento de `loja.session_version` ao inativar ou bloquear.

Proteção das sessões das lojas:

- o JWT emitido contém `loja_session_version`;
- middleware valida usuário ativo, loja ativa e versão da sessão em cada request;
- tokens antigos deixam de funcionar após inativação ou bloqueio;
- token administrativo não é aceito como token de loja;
- hostname/slug selecionado é comparado com a loja da sessão.

Não implementado ainda:

- ~~convite de usuário para uma loja pela Gestão;~~ **entregue em 29/07/2026**
- abas completas de uso, plano/módulos e auditoria no detalhe;
- observações internas;
- exportação CSV;
- ações administrativas de ativar/inativar usuário da loja (aba Usuários já lista
  e convida; status mutável ainda pendente).

### Convite de usuário para loja (F01.2) — 29/07/2026

- modelo `store_user_invitation` + migration aditiva;
- permissão `STORE_USER_INVITE` (`SUPER_ADMIN`, `OPERACAO`, `SUPORTE`);
- `POST/GET/PATCH/DELETE` e reenvio em `/admin/v1/stores/:id/user-invitations`;
- `GET /admin/v1/stores/:id/users` (e-mail mascarado para `ANALISTA`);
- aceite público `GET/POST /admin/v1/store-user-invitations/*`;
- cria `usuario` pendente + token 72h; cancelamento inativa o pendente;
- loja não ativa: só `SUPER_ADMIN` com justificativa;
- UI: aba Usuários no detalhe da loja + página `/convite-loja`.

### Desativação do convite legado da loja — 29/07/2026

- `POST /usuarios` **exige senha**; não cria mais pendente nem envia e-mail de
  convite pela área da loja.
- Tela `/usuarios/gestao/novo` remove a opção “convidar sem senha” e orienta que
  o convite por e-mail é só pela Gestão.
- `/primeiro-acesso` + `reenviar-codigo` / `definir-senha` permanecem apenas para
  pendências já emitidas no fluxo antigo.
- Login aponta novos convites para `/convite-loja`.
- `ConviteCadastro` (cadastro de loja nova / beta) **migrou para a Gestão** em
  29/07/2026 (`/gestao/convites-beta`); o painel legado
  `/admin-plataforma/convites` apenas redireciona.

### Convites beta / cadastro de loja nova — 29/07/2026

- permissão `SIGNUP_INVITE_MANAGE` (`SUPER_ADMIN`, `OPERACAO`, `SUPORTE`);
- API admin `GET/POST /admin/v1/signup-invitations`,
  `POST .../:id/resend`, `DELETE .../:id`;
- reutiliza `PlatformService` + `sendSignupInviteEmail` (e-mail preservado);
- fluxos públicos intactos: `/beta`, `/cadastro?convite=`,
  `POST /platform/interesse-beta`, validação de token;
- UI `/gestao/convites-beta` com templates WhatsApp, criar/reenviar/revogar;
- item de menu **Convites beta** na Gestão;
- auditoria `SIGNUP_INVITE_*`.

## 5. Novidades e changelog implementados

Modelos:

- `product_update`;
- `product_update_revision`.

Fluxo atual:

```text
DRAFT -> IN_REVIEW -> PUBLISHED
```

Implementado:

- criação manual de rascunho;
- criação automática após deploy;
- idempotência por `environment + commit_sha`;
- origem `MANUAL` ou `DEPLOY_AUTOMATION`;
- categorias, módulos, público e canais modelados;
- histórico imutável de revisões;
- revisão humana obrigatória antes da publicação;
- publicação exclusiva para `SUPER_ADMIN`;
- auditoria de criação, edição, revisão e publicação;
- página pública `/novidades`;
- detalhe público `/novidades/[slug]`;
- conteúdo exibido como texto, sem injeção de HTML;
- script pós-deploy com timeout e falha não bloqueante.

Automação:

- `backend/scripts/create-deploy-product-update.js`;
- chamada ao final de `scripts/deploy-vps.sh`;
- segredo separado em `ADMIN_DEPLOY_WEBHOOK_SECRET`;
- commits são usados apenas como insumo do rascunho;
- o deploy nunca publica conteúdo.

Não implementado ainda:

- edição de um rascunho pela interface, embora a API já suporte `PATCH`;
- agendamento, arquivamento e cancelamento;
- imagens e vídeo;
- pré-visualização;
- envio de teste;
- e-mail real, segmentação, preferências e supressões;
- central “O que há de novo” dentro do produto;
- marcação de leitura por usuário;
- sanitização/renderização completa de Markdown ou rich text.

Até existir provedor, `email_enabled` e `in_app_enabled` são apenas preparação de
domínio e não podem causar disparos.

## 6. Rotas implementadas

### Administração

```text
POST   /admin/v1/auth/login
GET    /admin/v1/auth/invitation
POST   /admin/v1/auth/invitation/accept
POST   /admin/v1/auth/2fa/confirm
GET    /admin/v1/auth/me
POST   /admin/v1/auth/logout

GET    /admin/v1/administrator-invitations
POST   /admin/v1/administrator-invitations
POST   /admin/v1/administrator-invitations/:id/resend
DELETE /admin/v1/administrator-invitations/:id

GET    /admin/v1/dashboard/summary

GET    /admin/v1/audit

GET    /admin/v1/stores
GET    /admin/v1/stores/:id
GET    /admin/v1/stores/:id/timeline
GET    /admin/v1/stores/:id/users
GET    /admin/v1/stores/:id/user-invitations
POST   /admin/v1/stores/:id/user-invitations
PATCH  /admin/v1/stores/:id/user-invitations/:invitationId
POST   /admin/v1/stores/:id/user-invitations/:invitationId/resend
DELETE /admin/v1/stores/:id/user-invitations/:invitationId
PATCH  /admin/v1/stores/:id/status
GET    /admin/v1/store-user-invitations/validate
POST   /admin/v1/store-user-invitations/accept

GET    /admin/v1/product-updates
POST   /admin/v1/product-updates
GET    /admin/v1/product-updates/:id
PATCH  /admin/v1/product-updates/:id
POST   /admin/v1/product-updates/:id/request-review
POST   /admin/v1/product-updates/:id/publish
```

### Automação e público

```text
POST /admin/v1/internal/deploy-product-updates
GET  /public/v1/product-updates
GET  /public/v1/product-updates/:slug
```

O frontend usa BFF em `/api/gestao/*`; o cookie administrativo é encaminhado
server-side e o token não é exposto ao JavaScript da página.

## 7. Interface implementada

Rotas:

- `/gestao/login`;
- `/gestao/aceitar-convite`;
- `/gestao`;
- `/gestao/lojas`;
- `/gestao/lojas/[id]`;
- `/gestao/administradores`;
- `/gestao/novidades`;
- `/gestao/auditoria`;
- `/novidades`;
- `/novidades/[slug]`.

Componentes globais em `frontend/src/components/gestao`:

- `AdminShell`;
- `AdminThemeToggle`;
- `AdminStatusBadge`;
- `AdminLoginForm`;
- `AdminInvitationAcceptance`;
- `AdminInvitationsManager`;
- `AdminAdministratorsPage`;
- `AdminUsersManager`;
- `AdminUserActionDialog`;
- `AdminUserCard`;
- `AdminDashboard`;
- `AdminAuditManager`;
- `AdminStoresManager`;
- `AdminStoreDetail`;
- `AdminStoreUsersManager`;
- `StoreUserInvitationAcceptance`;
- `AdminStoreTimeline`;
- `AdminStoreStatusDialog`;
- `AdminProductUpdatesManager`.

O detalhe da loja inclui abas Resumo | Usuários, timeline de suporte com
orçamentos excluídos (`excluido_por` / `excluido_em` / motivo) e eventos da
auditoria administrativa filtrados por `loja_id`. A tela `/gestao/auditoria`
aceita filtro por ID da loja.

`/gestao/administradores` tem abas Ativos (gestão de contas) e Convites.

As listagens (lojas, administradores/convites e novidades) seguem o template
CRUD de fornecedores: `DataTable` no desktop, cards em grid no mobile, toggle
Tabela/Cards no desktop, menu de ações por item e estados de carregamento,
erro e vazio. Classes compatíveis com temas, sem CSS inline.

## 8. Variáveis de ambiente

Obrigatórias para a Gestão:

```env
ADMIN_JWT_SECRET=
ADMIN_TWO_FACTOR_ENCRYPTION_KEY=
ADMIN_DEPLOY_WEBHOOK_SECRET=
ADMIN_SESSION_TTL_MINUTES="480"
GESTAO_FRONTEND_URL="http://localhost:3000/gestao"
```

Gere cada chave com `openssl rand -base64 48` e guarde somente no `.env` local
(ignorado pelo Git).

Em produção:

- gerar valores novos, fortes e independentes;
- nunca reutilizar `JWT_SECRET`;
- nunca copiar os valores do ambiente local;
- armazenar no mecanismo seguro já usado para o backend;
- restringir o arquivo de ambiente conforme o processo da VPS.

## 9. Validações já executadas

Na implementação atual foram aprovados:

- `prisma format`;
- `prisma validate`;
- `prisma generate`;
- build do backend;
- build do frontend;
- ESLint nos arquivos novos/alterados da Gestão;
- testes de autenticação, boundary guard, RBAC, lojas, JWT e middleware;
- testes do fluxo editorial, segredo do webhook e idempotência;
- `git diff --check`;
- sintaxe de `scripts/deploy-vps.sh`.

O build do frontend passa. O typecheck completo do repositório possui erros
legados fora do escopo; os arquivos novos da Gestão não apresentaram erro no
filtro executado.

## 10. Próximas entregas recomendadas

### P0 — concluir controle operacional

1. ~~dashboard real com contagens e filtros;~~ **entregue em 29/07/2026**
2. ~~consulta visual de auditoria;~~ **entregue em 29/07/2026**
3. ~~gestão de administradores ativos;~~ **entregue em 29/07/2026**
4. ~~convite de usuário vinculado a uma loja;~~ **entregue em 29/07/2026**
5. ~~completar detalhe da loja com usuários e timeline;~~ timeline e aba Usuários
   (lista + convites) entregues em 29/07/2026 (ativar/inativar usuário e demais
   abas ainda pendentes);
6. testes e2e HTTP de autenticação e isolamento.

### P1 — adoção e sucesso do cliente

1. eventos de uso;
2. agregados diários por loja;
3. último login e última atividade relevante;
4. saúde e alertas explicáveis;
5. observações internas;
6. exportação CSV assíncrona/auditada;
7. central “O que há de novo” dentro do produto.

### P2 — comercial

1. planos, módulos, limites e entitlements;
2. `loja_subscription` como fonte de verdade baseada em datas;
3. histórico de vigência;
4. adaptador neutro de billing;
5. webhooks idempotentes da futura operadora;
6. e-mail de novidades após escolha do provedor.

## 11. Cuidados para o próximo agente

- Não alterar migrations já aplicadas localmente; novas correções exigem nova
  migration aditiva.
- O banco é MySQL. Não usar `CREATE TYPE`, `JSONB`, aspas de identificador do
  PostgreSQL ou tipos incompatíveis.
- Não executar deploy nem migrations de produção sem autorização explícita.
- Não registrar tokens de convite, segredos locais ou valores do `.env`.
- Não transformar flags de e-mail em envio real sem preferências, supressões,
  idempotência por destinatário e provedor definido.
- Não confiar na UI para autorização.
- Preservar alterações locais de outros módulos. O worktree pode conter mudanças
  não relacionadas, especialmente em Arte/Aprovação e documentação Cloudflare.

## 12. Ponto exato de retomada

O próximo incremento recomendado é **ativar/inativar usuário da loja** pela Gestão
e completar as abas restantes do detalhe (uso, plano/módulos), seguido pelos
**testes e2e HTTP** de autenticação/isolamento.

Hostname de produção: `https://gestao.comunikapp.com.br` (local continua em
`/gestao`). Sem migration/deploy de produção até validação local autorizada.

