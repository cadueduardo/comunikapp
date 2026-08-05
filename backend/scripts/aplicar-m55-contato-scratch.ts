/**
 * Aplica a migration oficial M5.5 no MySQL scratch/ci (sem migrate deploy do zero).
 *
 * Pré-requisitos:
 * - DATABASE_URL → comunikapp_ci_scratch (ou banco com test/teste/scratch/ci)
 * - ALLOW_RBAC_TEST_MUTATIONS=true (mutação de schema autorizada no scratch)
 *
 * Uso:
 *   $env:ALLOW_RBAC_TEST_MUTATIONS='true'
 *   npx ts-node --transpile-only scripts/aplicar-m55-contato-scratch.ts
 */
import { createHash, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { validarAmbienteTesteMutavel } from './validar-ambiente-teste-mutavel';

const MIGRATION_NAME = '20260805120800_vendas_orcamento_add_contato';
const prisma = new PrismaClient();

async function colunaExiste(): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
    `SELECT COUNT(*) AS c
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orcamento'
       AND COLUMN_NAME = 'contato_id'`,
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function migrationRegistrada(): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ c: bigint }[]>(
    `SELECT COUNT(*) AS c
     FROM _prisma_migrations
     WHERE migration_name = ?`,
    MIGRATION_NAME,
  );
  return Number(rows[0]?.c ?? 0) > 0;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Proibido em production.');
  }
  const banco = validarAmbienteTesteMutavel();
  const url = process.env.DATABASE_URL!;
  const host = new URL(url).host;

  const sqlPath = join(
    __dirname,
    '..',
    'prisma',
    'migrations',
    MIGRATION_NAME,
    'migration.sql',
  );
  const sql = readFileSync(sqlPath, 'utf8');
  const checksum = createHash('sha256').update(sql).digest('hex');

  const jaTemColuna = await colunaExiste();
  let sqlAplicado = false;

  if (!jaTemColuna) {
    // Executa statements do arquivo oficial (sem editar migration).
    const semComentarios = sql
      .split(/\r?\n/)
      .filter((linha) => !linha.trim().startsWith('--'))
      .join('\n');
    const statements = semComentarios
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
    sqlAplicado = true;
  }

  if (!(await migrationRegistrada())) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO _prisma_migrations
        (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
       VALUES (?, ?, NOW(3), ?, NULL, NULL, NOW(3), 1)`,
      randomUUID(),
      checksum,
      MIGRATION_NAME,
    );
  }

  const coluna = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orcamento'
       AND COLUMN_NAME = 'contato_id'`,
  );
  const indice = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT INDEX_NAME, COLUMN_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orcamento'
       AND COLUMN_NAME = 'contato_id'`,
  );
  const fk = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT CONSTRAINT_NAME, DELETE_RULE, UPDATE_RULE, REFERENCED_TABLE_NAME
     FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orcamento'
       AND REFERENCED_TABLE_NAME = 'cliente_contato'`,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        host,
        banco,
        migration: MIGRATION_NAME,
        sql_aplicado_nesta_execucao: sqlAplicado,
        coluna_ja_existia: jaTemColuna,
        coluna,
        indice,
        fk,
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
  .finally(async () => {
    await prisma.$disconnect();
  });
