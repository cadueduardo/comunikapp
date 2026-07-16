# Deploy seguro de migrations em bancos legados

O deploy de producao cria e valida um backup do banco, executa
`backend/scripts/prisma-deploy-preflight.js` e somente depois chama
`prisma migrate deploy`. O objetivo e impedir que migrations de baseline sejam
executadas sobre tabelas que ja existem ou sobre um schema parcialmente divergente.

## Backup automatico

Antes de cada `migrate deploy`, `backend/scripts/mysql-backup-before-deploy.js`:

- usa `mariadb-dump` ou `mysqldump` com `--single-transaction`;
- compacta em streaming, sem deixar um `.sql` aberto no disco;
- grava primeiro em arquivo temporario;
- valida o arquivo com `gzip -t`;
- publica o backup somente depois da validacao;
- aplica permissao `600` no arquivo e `700` no diretorio;
- remove apenas backups do mesmo banco mais antigos que a retencao configurada.

Padroes:

```text
DB_BACKUP_DIR=/srv/apps/comunikapp/shared/backups/database
DB_BACKUP_RETENTION_DAYS=14
```

O nome segue o formato `banco-AAAAMMDDTHHMMSSZ.sql.gz`. Se o dump ou a verificacao
falhar, o deploy e interrompido antes do preflight e das migrations.

O script completo de VPS instala `mariadb-client` e `gzip`. No deploy simplificado,
esses pacotes devem estar instalados previamente.

## Comportamento

- Banco novo, sem migrations aplicadas: permite o replay completo.
- Banco existente com baseline ja registrado: segue normalmente.
- Banco existente com estruturas legadas completas, mas baseline pendente: valida
  tabelas e colunas e registra somente o baseline correspondente como aplicado.
- A estrutura de cada baseline é validada no ponto histórico em que ele foi criado.
  Colunas introduzidas por migrations posteriores não podem bloquear a conciliação;
  elas continuam sendo criadas normalmente pelo `prisma migrate deploy` na ordem.
- Estrutura parcial, coluna ausente ou tabela antiga inesperada: interrompe o deploy
  antes de executar DDL de negocio.
- Checksums historicos conhecidos e auditados podem ser alinhados. Qualquer checksum
  desconhecido bloqueia o deploy.

`PRISMA_APPLY=migrate` e o padrao dos scripts de VPS. `PRISMA_APPLY=push` fica
bloqueado porque `db push` altera o banco sem registrar a mudanca no historico.

## Antes da primeira atualizacao do cliente em producao

1. Confirme espaco livre e acesso ao diretorio persistente de backups.
2. Atualize o codigo, mas nao execute manualmente `migrate deploy`.
3. Carregue o mesmo `DATABASE_URL` usado pelo backend.
4. Execute apenas a auditoria:

   ```bash
   cd backend
   node scripts/prisma-deploy-preflight.js --audit-legacy
   ```

5. Se a auditoria terminar com `migrate deploy autorizado`, execute o script normal
   de deploy com `PRISMA_APPLY=migrate`.
6. Se aparecer `BLOQUEADO`, nao use `resolve`, `db push` ou `migrate reset`. Preserve
   a saida, restaure/clone o backup em homologacao e reconcilie a diferenca primeiro.

## Teste de restauracao

O backup automatico protege a atualizacao, mas deve ser testado periodicamente em
um banco separado. Exemplo:

```bash
gzip -dc /srv/apps/comunikapp/shared/backups/database/comunikapp-DATA.sql.gz \
  | mariadb --host=HOST --user=USUARIO --password
```

Como o dump usa `--databases`, ele inclui a selecao/criacao do banco original.
Para um ensaio isolado, restaure em outra instancia ou ajuste o SQL de destino de
forma controlada. Nunca teste a restauracao sobre o banco de producao ativo.

Backups mantidos apenas na mesma VPS nao protegem contra perda total do servidor.
Copie-os tambem para armazenamento externo criptografado e monitore a idade do
ultimo arquivo valido.

## Scripts protegidos

- `scripts/deploy-vps.sh`
- `scripts/deploy-vps-branch-atual.sh`

O antigo `scripts/fix-migration-history-vps.sh` foi desativado porque marcava varias
migrations como aplicadas sem comprovar que suas estruturas existiam.

O comportamento temporal do preflight possui teste de regressão em
`backend/scripts/prisma-deploy-preflight.test.js`. Execute com:

```bash
cd backend
node --test scripts/prisma-deploy-preflight.test.js
```
