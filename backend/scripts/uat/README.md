# Sanitização do banco UAT (MySQL)

Script versionado para neutralizar dados pessoais e integrações depois de
restaurar um snapshot de produção em `comunikapp_uat`.

## Regras

- Executar **somente** no database `comunikapp_uat`.
- Nunca apontar o cliente `mysql` para `comunikapp` (produção).
- O script aborta se `DATABASE()` não for `comunikapp_uat`.
- É idempotente: pode ser reaplicado após renovar o snapshot.
- Não imprime valores anteriores; apenas contagens.
- Eventos do MySQL Event Scheduler permanecem fora do dump (`--skip-events`).

## Como aplicar (VPS)

```bash
sudo mysql --default-character-set=utf8mb4 comunikapp_uat \
  < backend/scripts/uat/sanitize-comunikapp-uat.sql
```

Autenticação: use o mecanismo já adotado na VPS (`sudo mysql` via socket),
nunca senha na linha de comando.

## Depois da sanitização

Não iniciar frontend, backend, workers ou cron do UAT enquanto o script não
tiver sido aplicado com sucesso. Senhas de loja/admin de produção não devem
permanecer utilizáveis; o passo operacional de bootstrap de senha UAT fica no
arquivo de ambiente protegido da VPS, fora deste repositório.

### Restaurar operadores (e-mail real + senha de produção)

A sanitização reescreve todos os `usuario.email`. Para testar convites SMTP no
UAT com a conta da loja, restaure **somente** os e-mails listados em
`/srv/apps/comunikapp-uat/shared/env/operator-restore.env` (não versionar):

```bash
sudo python3 backend/scripts/uat/restore-operator-from-prod.py
```

O script copia e-mail, nome, hash de senha e e-mail da loja a partir de
`comunikapp` pelo mesmo `id`. Não copia 2FA. Não imprime senha nem hash.
Outros usuários permanecem `@uat.invalid`.

O cookie de sessão do UAT é `comunikapp_session_uat` (definido no
`ecosystem.uat.config.js`) para não colidir com o cookie de produção
`comunikapp_session` em `.comunikapp.com.br`.
