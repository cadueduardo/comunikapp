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

Para deploys criticos (Gate 0S), o operador **nao** chama o script do working tree
da VPS. Extrai o entrypoint e os helpers do commit autorizado com `git archive`
para um diretorio temporario:

```bash
PROJECT_DIR=/opt/comunikapp/app
BRANCH=feat/modulo-vendas
EXPECTED_COMMIT=<sha>

sudo -u comunikapp git -C "$PROJECT_DIR" fetch origin --prune

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git -C "$PROJECT_DIR" archive "$EXPECTED_COMMIT" \
  scripts/run-deploy-from-expected-commit.sh \
  scripts/deploy-vps-branch-atual.sh \
  scripts/lib/assert-expected-commit.sh \
  | tar -x -C "$TMP"
chmod -R a+rX "$TMP"

sudo env \
  PROJECT_DIR="$PROJECT_DIR" \
  BRANCH="$BRANCH" \
  EXPECTED_COMMIT="$EXPECTED_COMMIT" \
  PRISMA_APPLY=migrate \
  INSTALL_SYSTEM_PACKAGES=0 \
  APPLY_NGINX=0 \
  APPLY_FAIL2BAN=0 \
  RUN_AUDIT=1 \
  bash "$TMP/scripts/run-deploy-from-expected-commit.sh"
```

O entrypoint `run-deploy-from-expected-commit.sh` exige working tree limpo,
confirma com `git cat-file` que o objeto e `commit`, exige
`origin/$BRANCH == EXPECTED_COMMIT` e aborta **antes** de build/backup/migration
se houver divergencia. Recusa executar fora de `/tmp` ou `/var/tmp` (exceto ensaio
com `ALLOW_NON_TMP_DEPLOY_EXTRACT=1`).

`scripts/deploy-vps-branch-atual.sh` tambem aceita `EXPECTED_COMMIT` via ambiente.
Quando informado, apos o `git pull` e **antes** de `npm ci`, build, backup ou
migration:

1. resolve `git rev-parse HEAD`;
2. resolve o valor informado (hash completo ou prefixo hex);
3. aborta se nao houver correspondencia, se o prefixo for ambiguo (mais de um
   objeto) ou se HEAD divergir.

`RUN_AUDIT` permanece `1` por padrao no Gate 0S. O deploy roda
`npm audit --omit=dev --json` e compara com
`scripts/security/npm-audit-baseline.json` (comparador
`scripts/security/compare-npm-audit-baseline.js`). Excecoes sao temporarias
(`expiresAt`); `critical` nunca passa; finding novo, severidade maior, cadeia/faixa
alterada, excecao expirada ou JSON invalido falham o deploy. Builds, backup,
preflight, migration e health checks nao devem ser desabilitados.

Testes:

```bash
bash scripts/lib/assert-expected-commit.test.sh
bash scripts/run-deploy-from-expected-commit.test.sh
node scripts/security/compare-npm-audit-baseline.test.js
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
`gzip -t`. Isso comprova integridade do arquivo comprimido — **nao** e teste de
restauracao.

Antes de autorizar um deploy critico, quando houver capacidade segura:

1. gere o backup com o mesmo mecanismo do deploy
   (`backend/scripts/mysql-backup-before-deploy.js`);
2. restaure em um banco scratch (outra instancia ou database descartavel — nunca
   producao);
3. registre somente: arquivo/horario, tamanho, engine/versao do scratch,
   restauracao concluida ou falhou, tabelas essenciais encontradas, contagem
   agregada de registros, descarte do scratch;
4. descarte o scratch. Nao exponha dados do dump.

Ensaio automatizado (dev local, fora de producao):

```bash
cd backend
node scripts/ensaio-restauracao-scratch-gate0s.js
```

Se nao houver ambiente seguro para o ensaio, trate como bloqueio e solicite
decisao explicita de aceite de risco antes de autorizar o deploy.

Backups mantidos apenas na mesma VPS nao protegem contra perda total do servidor.
Copie-os tambem para armazenamento externo criptografado e monitore a idade do
ultimo arquivo valido.

## Scripts protegidos

- `scripts/run-deploy-from-expected-commit.sh` (entrypoint Gate 0S via `git archive`)
- `scripts/deploy-vps.sh`
- `scripts/deploy-vps-branch-atual.sh`
- `scripts/security/compare-npm-audit-baseline.js`
- `scripts/security/npm-audit-baseline.json`
- `backend/scripts/ensaio-restauracao-scratch-gate0s.js`
- `backend/scripts/smoke-sharp-upload.mjs`

O antigo `scripts/fix-migration-history-vps.sh` foi desativado porque marcava varias
migrations como aplicadas sem comprovar que suas estruturas existiam.

O comportamento temporal do preflight possui teste de regressão em
`backend/scripts/prisma-deploy-preflight.test.js`. Execute com:

```bash
cd backend
node --test scripts/prisma-deploy-preflight.test.js
```
