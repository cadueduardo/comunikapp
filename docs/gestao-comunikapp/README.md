# Gestão ComunikApp

Especificação do painel interno usado pela equipe do ComunikApp para administrar as lojas participantes da plataforma.

## Documento principal

- [RP — Gestão Administrativa do ComunikApp](./RP-gestao-administrativa-comunikapp.md)
- [Status de implementação e handoff técnico](./STATUS-IMPLEMENTACAO.md)

## Objetivo da primeira entrega

Dar à operação do ComunikApp uma visão central e segura para:

1. localizar e acompanhar todas as lojas;
2. ativar, inativar e bloquear o acesso de uma loja;
3. entender adoção e uso do produto por loja;
4. administrar plano, trial, módulos e limites;
5. registrar toda ação administrativa em auditoria;
6. identificar lojas que precisam de suporte ou acompanhamento;
7. convidar administradores e usuários de lojas por nome e e-mail, com perfis e permissões controlados.

Este diretório é a fonte de verdade funcional para a implementação. Decisões que alterem regras de negócio devem ser registradas no documento principal.

## Implementação iniciada em 29/07/2026

A primeira fatia contém:

- identidade administrativa separada de usuários de loja;
- cookie administrativo host-only e JWT com chave exclusiva;
- sessões administrativas revogáveis;
- 2FA obrigatório para `SUPER_ADMIN`;
- RBAC com negação por padrão;
- auditoria append-only;
- convites administrativos com token de uso único;
- lista, detalhe e alteração segura do status de lojas;
- revogação persistente de tokens de loja por `session_version`;
- interface responsiva inicial em `/gestao`;
- preparação para `gestao.comunikapp.com.br`.
- gestão editorial de novidades com revisão e publicação humana;
- changelog público em `/novidades`;
- criação idempotente e não bloqueante de rascunho após o deploy;
- gestão de administradores ativos (perfil, inativação, proteção do último
  `SUPER_ADMIN`).

### Configuração local

Defina chaves diferentes e fortes no `backend/.env` (não no Git). Gere cada
valor com `openssl rand -base64 48`:

```env
ADMIN_JWT_SECRET=
ADMIN_TWO_FACTOR_ENCRYPTION_KEY=
ADMIN_DEPLOY_WEBHOOK_SECRET=
ADMIN_SESSION_TTL_MINUTES="480"
GESTAO_FRONTEND_URL="http://localhost:3000/gestao"
```

Em produção, as chaves administrativas são obrigatórias.
`ADMIN_JWT_SECRET` não pode ser igual a `JWT_SECRET`.

### Primeiro `SUPER_ADMIN`

Depois de aplicar a migration, gere o primeiro convite:

```bash
cd backend
npm run admin:bootstrap -- --name "Nome completo" --email "email@dominio.com"
```

O comando:

- recusa executar se já existir um `SUPER_ADMIN` ativo;
- cria ou renova um único convite pendente para o e-mail;
- mostra o link uma única vez;
- nunca define ou imprime uma senha;
- exige configuração de 2FA durante o aceite.

Depois do bootstrap, novos administradores devem ser convidados pela própria
Gestão. O mecanismo legado `PLATFORM_ADMIN_EMAILS` será removido após a migração
da funcionalidade antiga de convites de lojas.

### Migration

Migration aditiva:

```text
backend/prisma/migrations/20260729100000_add_gestao_admin_foundation
backend/prisma/migrations/20260729150000_add_product_updates
```

Ela não deve ser editada depois de aplicada. O deploy deve seguir o preflight,
backup e processo definidos em `docs/database/boas-praticas-schema-prisma.md`.

### Novidades e deploy

Depois que os serviços reiniciam com sucesso, `scripts/deploy-vps.sh` executa
`backend/scripts/create-deploy-product-update.js`. O script:

- usa `ambiente + commit SHA` como chave idempotente;
- cria somente um rascunho, nunca uma publicação;
- inclui os commits como insumo técnico para revisão;
- usa `ADMIN_DEPLOY_WEBHOOK_SECRET`, separado das chaves de sessão;
- tem timeout de 10 segundos;
- registra aviso, mas não invalida um deploy bem-sucedido se a Gestão estiver
  indisponível.

O fluxo editorial fica disponível em `/gestao/novidades`. Somente
`SUPER_ADMIN` publica; `OPERACAO` pode criar e enviar rascunhos para revisão.
Os canais de e-mail e comunicação dentro do produto estão modelados, porém o
disparo permanece desabilitado até a contratação e configuração dos provedores.
