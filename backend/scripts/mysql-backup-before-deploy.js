#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const databaseUrl = process.env.DATABASE_URL;
const defaultBackupDir = process.platform === 'win32'
  ? path.resolve(__dirname, '..', 'backups', 'database')
  : '/srv/apps/comunikapp/shared/backups/database';
const backupDir = path.resolve(
  process.env.DB_BACKUP_DIR || defaultBackupDir,
);
const retentionDays = Number(process.env.DB_BACKUP_RETENTION_DAYS || '14');

function log(message) {
  process.stdout.write(`[db-backup] ${message}\n`);
}

function fail(message) {
  throw new Error(`[db-backup] ${message}`);
}

function findCommand(candidates) {
  for (const command of candidates) {
    const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
    if (!result.error && result.status === 0) return command;
  }
  return null;
}

function windowsCandidates(commandNames, commonDirectories) {
  return [
    ...commandNames,
    ...commonDirectories.flatMap((directory) =>
      commandNames.map((command) => path.join(directory, command)),
    ),
  ];
}

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function parseConnection() {
  if (!databaseUrl) fail('DATABASE_URL nao definida.');
  const url = new URL(databaseUrl);
  if (url.protocol !== 'mysql:') fail(`protocolo nao suportado: ${url.protocol}`);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!database) fail('nome do banco ausente na DATABASE_URL.');
  return {
    host: url.hostname || 'localhost',
    port: url.port || '3306',
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    socket: url.searchParams.get('socket'),
  };
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function runBackup(dumpCommand, gzipCommand, connection, temporaryFile) {
  const args = [
    '--single-transaction',
    '--quick',
    '--routines',
    '--triggers',
    '--events',
    '--hex-blob',
    '--default-character-set=utf8mb4',
    `--host=${connection.host}`,
    `--port=${connection.port}`,
    `--user=${connection.user}`,
  ];
  if (connection.socket) args.push(`--socket=${connection.socket}`);
  args.push('--databases', connection.database);

  const childEnv = { ...process.env, MYSQL_PWD: connection.password };
  const dump = spawn(dumpCommand, args, { env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] });
  const gzip = spawn(gzipCommand, ['-c', '-6'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const output = fs.createWriteStream(temporaryFile, { flags: 'wx', mode: 0o600 });
  const errors = [];

  dump.stderr.on('data', (chunk) => errors.push(`[dump] ${chunk.toString()}`));
  gzip.stderr.on('data', (chunk) => errors.push(`[gzip] ${chunk.toString()}`));
  dump.stdout.pipe(gzip.stdin);
  gzip.stdout.pipe(output);

  return new Promise((resolve, reject) => {
    let dumpCode;
    let gzipCode;
    let outputFinished = false;

    const finish = () => {
      if (dumpCode === undefined || gzipCode === undefined || !outputFinished) return;
      if (dumpCode !== 0 || gzipCode !== 0) {
        reject(new Error(`dump=${dumpCode}, gzip=${gzipCode}\n${errors.join('')}`));
        return;
      }
      resolve();
    };

    dump.on('error', reject);
    gzip.on('error', reject);
    output.on('error', reject);
    dump.on('close', (code) => { dumpCode = code; finish(); });
    gzip.on('close', (code) => { gzipCode = code; finish(); });
    output.on('finish', () => { outputFinished = true; finish(); });
  });
}

function verifyArchive(gzipCommand, file) {
  const stat = fs.statSync(file);
  if (stat.size < 100) fail(`arquivo de backup muito pequeno: ${stat.size} bytes.`);
  const result = spawnSync(gzipCommand, ['-t', file], { stdio: 'inherit' });
  if (result.error || result.status !== 0) fail('teste de integridade gzip falhou.');
  return stat.size;
}

function applyRetention(database) {
  if (!Number.isFinite(retentionDays) || retentionDays < 1) {
    fail('DB_BACKUP_RETENTION_DAYS deve ser um inteiro maior ou igual a 1.');
  }
  const prefix = `${sanitize(database)}-`;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const entry of fs.readdirSync(backupDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.startsWith(prefix) || !entry.name.endsWith('.sql.gz')) continue;
    const file = path.join(backupDir, entry.name);
    if (fs.statSync(file).mtimeMs < cutoff) {
      fs.unlinkSync(file);
      log(`retencao removeu backup antigo: ${entry.name}`);
    }
  }
}

async function main() {
  const connection = parseConnection();
  const dumpCommand = findCommand(
    process.platform === 'win32'
      ? windowsCandidates(
          ['mariadb-dump.exe', 'mysqldump.exe'],
          [
            'C:\\xampp\\mysql\\bin',
            'C:\\Program Files\\MariaDB 11.8\\bin',
            'C:\\Program Files\\MariaDB 11.4\\bin',
          ],
        )
      : ['mariadb-dump', 'mysqldump'],
  );
  const gzipCommand = findCommand(
    process.platform === 'win32'
      ? windowsCandidates(
          ['gzip.exe'],
          ['C:\\Program Files\\Git\\usr\\bin'],
        )
      : ['gzip'],
  );

  if (DRY_RUN) {
    log(`dry-run: banco=${connection.database}, host=${connection.host}:${connection.port}`);
    log(`dry-run: destino=${backupDir}, retencao=${retentionDays} dias`);
    log(`dry-run: dump=${dumpCommand || 'NAO ENCONTRADO'}, gzip=${gzipCommand || 'NAO ENCONTRADO'}`);
    return;
  }

  if (!dumpCommand) fail('mariadb-dump/mysqldump nao encontrado. Instale mariadb-client.');
  if (!gzipCommand) fail('gzip nao encontrado.');

  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
  fs.chmodSync(backupDir, 0o700);

  const filename = `${sanitize(connection.database)}-${timestamp()}.sql.gz`;
  const finalFile = path.join(backupDir, filename);
  const temporaryFile = `${finalFile}.part-${process.pid}`;

  log(`iniciando backup consistente de ${connection.database}...`);
  try {
    await runBackup(dumpCommand, gzipCommand, connection, temporaryFile);
    const size = verifyArchive(gzipCommand, temporaryFile);
    fs.renameSync(temporaryFile, finalFile);
    fs.chmodSync(finalFile, 0o600);
    applyRetention(connection.database);
    log(`backup validado: ${finalFile} (${size} bytes)`);
  } catch (error) {
    if (fs.existsSync(temporaryFile)) fs.unlinkSync(temporaryFile);
    throw error;
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message || error}\n`);
  process.exitCode = 1;
});
