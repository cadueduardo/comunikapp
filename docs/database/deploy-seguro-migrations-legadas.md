# Deploy seguro de migrations em bancos legados

O deploy de producao instala as dependencias e valida os builds antes de qualquer
alteracao no banco. Somente com os artefatos compilados ele cria e valida um backup,
executa `backend/scripts/prisma-deploy-preflight.js` e chama
`prisma migrate deploy`. O objetivo e impedir tanto uma migration com build quebrado
quanto a execucao de baselines sobre tabelas que ja existem ou sobre um schema
parcialmente divergente.

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

**O que o script comprova automaticamente:** tamanho minimo (`>= 100` bytes) e
integridade do arquivo gzip (`gzip -t`). Isso e evidencia de que o arquivo nao
esta truncado/corrupto no nivel do compressão — **nao** substitui um teste
completo de restauracao.

**Teste de restauracao em banco scratch:** continua obrigatorio antes de autorizar
um deploy critico (Gate 0S), quando houver capacidade segura para executa-lo sem
tocar no banco de producao. Ver secao "Teste de restauracao" abaixo.

## Artefato fixado (EXPECTED_COMMIT)

`scripts/deploy-vps-branch-atual.sh` aceita `EXPECTED_COMMIT` via ambiente. Quando
informado, apos o `git pull` e **antes** de `npm ci`, build, backup ou migration:

1. resolve `git rev-parse HEAD`;
2. resolve o valor informado (hash completo ou prefixo hex);
3. aborta se nao houver correspondencia, se o prefixo for ambiguo (mais de um
   objeto) ou se HEAD divergir.

Forma correta de passar variaveis (nunca como argumentos apos o caminho):

```bash
sudo env \
  BRANCH=feat/modulo-vendas \
  EXPECTED_COMMIT=<sha> \
  PRISMA_APPLY=migrate \
  INSTALL_SYSTEM_PACKAGES=0 \
  APPLY_NGINX=0 \
  APPLY_FAIL2BAN=0 \
  bash /opt/comunikapp/app/scripts/deploy-vps-branch-atual.sh
```

`RUN_AUDIT` permanece `1` por padrao e deve ficar ativo no Gate 0S. Builds,
backup, preflight, migration e health checks nao devem ser desabilitados.

Teste da checagem de commit:

```bash
bash scripts/lib/assert-expected-commit.test.sh
```

Padroes:

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

Os scripts tambem bloqueiam o deploy quando `git status --porcelain` encontra
arquivos alterados, staged ou nao rastreados. O script simplificado usa o branch
atualmente selecionado quando `BRANCH` nao e informado; ele nao possui branch de
feature hardcoded como fallback.

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

O backup automatico protege a atualizacao e valida o arquivo com tamanho minimo +
`gzip -t`. Isso **nao** e um teste completo de restauracao.

Antes de autorizar um deploy critico, quando houver capacidade segura:

1. copie o `.sql.gz` para um host ou instancia que **nao** seja o MySQL de
   producao;
2. restaure em um banco scratch (outra instancia ou database descartavel);
3. confira `SELECT COUNT(*)` em tabelas-chave e a ausencia de erro no load;
4. descarte o scratch.

Exemplo (ajuste host/usuario; nunca aponte para producao):

```bash
gzip -dc /srv/apps/comunikapp/shared/backups/database/comunikapp-DATA.sql.gz \
  | mysql --host=SCRATCH_HOST --user=USUARIO --password
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
