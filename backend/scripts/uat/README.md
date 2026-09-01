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
