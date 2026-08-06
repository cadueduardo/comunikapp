/**
 * Aplica M5.1–M5.5 de forma idempotente no DATABASE_URL atual (dev local).
 * Lê os SQL oficiais das pastas de migration — não edita migrations.
 *
 * Uso:
 *   npx ts-node --transpile-only scripts/aplicar-fase5-schema-local.ts
 *
 * Recusa NODE_ENV=production. Destinado ao MySQL/MariaDB de desenvolvimento.
 */
import { createHash, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MIGRATIONS = [
  '20260805120400_vendas_add_atividade_comercial',
  '20260805120500_notificacao_add_destinatario',
  '20260805120600_vendas_add_atendimento_idempotencia',
  '20260805120700_vendas_add_outbox_email',
  '20260805120800_vendas_orcamento_add_contato',
] as const;

async function tabelaExiste(nome: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint | number }[]>(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    nome,
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function colunaExiste(tabela: string, coluna: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint | number }[]>(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    tabela,
    coluna,
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function indiceExiste(nome: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint | number }[]>(
    `SELECT COUNT(*) AS c FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = ?`,
    nome,
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function fkExiste(nome: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint | number }[]>(
    `SELECT COUNT(*) AS c FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
       AND CONSTRAINT_NAME = ?`,
    nome,
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function migrationRegistrada(nome: string): Promise<boolean> {
  if (!(await tabelaExiste('_prisma_migrations'))) return false;
  const rows = await prisma.$queryRawUnsafe<{ c: bigint | number }[]>(
    `SELECT COUNT(*) AS c FROM _prisma_migrations WHERE migration_name = ?`,
    nome,
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

function statementsFromSql(sql: string): string[] {
  return sql
    .split(/\r?\n/)
    .filter((linha) => !linha.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function execIdempotente(stmt: string): Promise<'ok' | 'skip'> {
  const upper = stmt.toUpperCase();

  // CREATE TABLE
  const mCreate = stmt.match(/CREATE\s+TABLE\s+`?(\w+)`?/i);
  if (mCreate && (await tabelaExiste(mCreate[1]))) return 'skip';

  // ADD COLUMN
  const mCol = stmt.match(
    /ALTER\s+TABLE\s+`?(\w+)`?\s+ADD\s+COLUMN\s+`?(\w+)`?/i,
  );
  if (mCol && (await colunaExiste(mCol[1], mCol[2]))) return 'skip';

  // CREATE INDEX / UNIQUE INDEX
  const mIdx = stmt.match(
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+`?(\w+)`?/i,
  );
  if (mIdx && (await indiceExiste(mIdx[1]))) return 'skip';

  // ADD CONSTRAINT FK
  const mFk = stmt.match(/ADD\s+CONSTRAINT\s+`?(\w+)`?/i);
  if (mFk && (await fkExiste(mFk[1]))) return 'skip';

  try {
    await prisma.$executeRawUnsafe(stmt);
    return 'ok';
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // MariaDB/MySQL: já existe
    if (
      /Duplicate|already exists|1060|1061|1062|1826/i.test(msg) ||
      upper.includes('ADD COLUMN') && /Duplicate column/i.test(msg)
    ) {
      return 'skip';
    }
    throw e;
  }
}

async function registrarMigration(nome: string, sql: string) {
  if (!(await tabelaExiste('_prisma_migrations'))) return;
  if (await migrationRegistrada(nome)) return;
  const checksum = createHash('sha256').update(sql).digest('hex');
  await prisma.$executeRawUnsafe(
    `INSERT INTO _prisma_migrations
      (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES (?, ?, NOW(3), ?, NULL, NULL, NOW(3), 1)`,
    randomUUID(),
    checksum,
    nome,
  );
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Proibido em NODE_ENV=production.');
  }
  const url = process.env.DATABASE_URL ?? '';
  if (!url) throw new Error('DATABASE_URL não definida.');
  const host = new URL(url).host;
  const banco = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));

  const resultado: Array<{
    migration: string;
    aplicados: number;
    pulados: number;
  }> = [];

  for (const nome of MIGRATIONS) {
    const sqlPath = join(
      __dirname,
      '..',
      'prisma',
      'migrations',
      nome,
      'migration.sql',
    );
    const sql = readFileSync(sqlPath, 'utf8');
    let aplicados = 0;
    let pulados = 0;
    for (const stmt of statementsFromSql(sql)) {
      const r = await execIdempotente(stmt);
      if (r === 'ok') aplicados += 1;
      else pulados += 1;
    }
    await registrarMigration(nome, sql);
    resultado.push({ migration: nome, aplicados, pulados });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        host,
        banco,
        resultado,
        pos: {
          atividade_comercial: await tabelaExiste('atividade_comercial'),
          atendimento_idempotencia: await tabelaExiste(
            'atendimento_idempotencia',
          ),
          outbox_email_vendas: await tabelaExiste('outbox_email_vendas'),
          notificacao_usuario_id: await colunaExiste('notificacao', 'usuario_id'),
          orcamento_contato_id: await colunaExiste('orcamento', 'contato_id'),
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
