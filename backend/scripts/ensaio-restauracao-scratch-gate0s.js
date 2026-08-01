/**
 * Gate 0S — ensaio de restauração scratch do backup gerado pelo mesmo
 * mecanismo do deploy (`mysql-backup-before-deploy.js`).
 *
 * NÃO aponta para produção. Usa apenas o MySQL/MariaDB local e um database
 * descartável. A saída é sanitizada: arquivo, horário, tamanho, engine,
 * sucesso/falha, tabelas essenciais (só nomes), contagem agregada e descarte.
 *
 * Uso:
 *   node scripts/ensaio-restauracao-scratch-gate0s.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const SCRATCH_DB = 'comunikapp_scratch_gate0s';
const ESSENCIAIS = [
  'orcamento',
  'ordens_servico',
  '_prisma_migrations',
  'loja',
  'usuario',
];

function fail(msg) {
  process.stderr.write(`[scratch-restore] ${msg}\n`);
  process.exit(1);
}

function log(msg) {
  process.stdout.write(`[scratch-restore] ${msg}\n`);
}

function findMysql() {
  const candidates =
    process.platform === 'win32'
      ? [
          'C:\\xampp\\mysql\\bin\\mysql.exe',
          'mysql',
        ]
      : ['mysql', 'mariadb'];
  for (const c of candidates) {
    const r = spawnSync(c, ['--version'], { encoding: 'utf8' });
    if (!r.error && r.status === 0) return c;
  }
  return null;
}

function mysqlExec(mysqlBin, sql, database) {
  const args = ['-uroot', '-N', '-B'];
  if (database) args.push(database);
  args.push('-e', sql);
  const r = spawnSync(mysqlBin, args, { encoding: 'utf8' });
  if (r.status !== 0) {
    fail(`mysql falhou: ${(r.stderr || r.stdout || '').slice(0, 200)}`);
  }
  return (r.stdout || '').trim();
}

async function main() {
  const mysqlBin = findMysql();
  if (!mysqlBin) fail('cliente mysql/mariadb nao encontrado.');

  const version = mysqlExec(mysqlBin, 'SELECT VERSION();');
  log(`engine_scratch=${version}`);

  const backupDir = path.resolve(__dirname, '..', 'tmp-scratch-backups');
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });

  // Gera backup pelo MESMO script do deploy, apontando para o banco local
  // de desenvolvimento (nao producao).
  const backupEnv = {
    ...process.env,
    DB_BACKUP_DIR: backupDir,
    DB_BACKUP_RETENTION_DAYS: '1',
  };
  const backup = spawnSync(
    process.execPath,
    [path.join(__dirname, 'mysql-backup-before-deploy.js')],
    { env: backupEnv, encoding: 'utf8' },
  );
  if (backup.status !== 0) {
    fail(`backup falhou: ${(backup.stderr || backup.stdout || '').slice(0, 300)}`);
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith('.sql.gz'))
    .map((f) => ({
      name: f,
      full: path.join(backupDir, f),
      mtime: fs.statSync(path.join(backupDir, f)).mtime,
      size: fs.statSync(path.join(backupDir, f)).size,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (!files.length) fail('nenhum .sql.gz gerado.');
  const arquivo = files[0];
  log(`arquivo=${arquivo.name}`);
  log(`horario_utc=${arquivo.mtime.toISOString()}`);
  log(`tamanho_bytes=${arquivo.size}`);

  // Descarta scratch previo e cria vazio.
  mysqlExec(
    mysqlBin,
    `DROP DATABASE IF EXISTS \`${SCRATCH_DB}\`; CREATE DATABASE \`${SCRATCH_DB}\`;`,
  );

  // Restaura substituindo apenas o nome do database nas linhas DDL de cabecalho.
  // Nao imprime o dump.
  const gzip = process.platform === 'win32' ? 'gzip' : 'gzip';
  const gzipCandidates =
    process.platform === 'win32'
      ? [
          'C:\\Program Files\\Git\\usr\\bin\\gzip.exe',
          'gzip',
        ]
      : ['gzip'];
  let gzipBin = null;
  for (const c of gzipCandidates) {
    const r = spawnSync(c, ['-V'], { encoding: 'utf8' });
    // gzip -V escreve em stderr e pode retornar 0
    if (!r.error) {
      gzipBin = c;
      break;
    }
  }
  if (!gzipBin) fail('gzip nao encontrado.');

  const sourceDb = (() => {
    const m = String(process.env.DATABASE_URL || '').match(
      /\/([^/?]+)(\?|$)/,
    );
    return m ? decodeURIComponent(m[1]) : 'comunikapp';
  })();

  const decompress = spawnSync(gzipBin, ['-dc', arquivo.full], {
    encoding: 'buffer',
    maxBuffer: 1024 * 1024 * 512,
  });
  if (decompress.status !== 0) {
    fail('falha ao descomprimir backup para scratch.');
  }

  // Substitui so CREATE DATABASE / USE no cabecalho (primeiros 8 KiB).
  let sql = decompress.stdout;
  const headLen = Math.min(sql.length, 8192);
  let head = sql.subarray(0, headLen).toString('utf8');
  const escapedSource = sourceDb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  head = head
    .replace(
      new RegExp('CREATE DATABASE[^;]*`' + escapedSource + '`', 'i'),
      (m) => m.replace('`' + sourceDb + '`', '`' + SCRATCH_DB + '`'),
    )
    .replace(
      new RegExp('USE `' + escapedSource + '`', 'i'),
      'USE `' + SCRATCH_DB + '`',
    );
  const patched = Buffer.concat([
    Buffer.from(head, 'utf8'),
    sql.subarray(headLen),
  ]);

  const restore = spawnSync(mysqlBin, ['-uroot'], {
    input: patched,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 64,
  });

  if (restore.status !== 0) {
    log('restauracao=falhou');
    fail(`restore: ${(restore.stderr || '').slice(0, 200)}`);
  }
  log('restauracao=concluida');

  const tabelas = mysqlExec(
    mysqlBin,
    `SELECT table_name FROM information_schema.tables WHERE table_schema='${SCRATCH_DB}' ORDER BY table_name;`,
  )
    .split(/\r?\n/)
    .filter(Boolean);

  const encontradas = ESSENCIAIS.filter((t) => tabelas.includes(t));
  log(`tabelas_essenciais_encontradas=${encontradas.join(',')}`);
  log(
    `tabelas_essenciais_ausentes=${ESSENCIAIS.filter((t) => !tabelas.includes(t)).join(',') || '(nenhuma)'}`,
  );

  // Contagem agregada — so numeros, sem conteudo.
  let total = 0;
  for (const t of encontradas) {
    const n = Number(
      mysqlExec(mysqlBin, `SELECT COUNT(*) FROM \`${t}\`;`, SCRATCH_DB) || '0',
    );
    total += Number.isFinite(n) ? n : 0;
  }
  log(`contagem_agregada_registros_essenciais=${total}`);
  log(`total_tabelas_no_scratch=${tabelas.length}`);

  mysqlExec(mysqlBin, `DROP DATABASE IF EXISTS \`${SCRATCH_DB}\`;`);
  log('descarte_scratch=ok');

  // Remove o backup local do ensaio (nao e evidência a preservar com dados).
  try {
    fs.unlinkSync(arquivo.full);
  } catch (_) {
    /* ignore */
  }
  log('ensaio_ok=1');
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));
