/**
 * Inspeção sanitizada do estado M5.5 no MySQL scratch.
 * Uso: npx ts-node --transpile-only scripts/inspecionar-m55-contato-scratch.ts
 */
import { PrismaClient } from '@prisma/client';
import { validarAmbienteTesteMutavel } from './validar-ambiente-teste-mutavel';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Proibido em production.');
  }
  // Aceita inspeção sem ALLOW se só leitura — mas exige banco scratch/ci.
  const url = process.env.DATABASE_URL ?? '';
  const nomeBanco = decodeURIComponent(
    new URL(url).pathname.replace(/^\//, ''),
  );
  if (!/(test|teste|scratch|ci)/i.test(nomeBanco)) {
    throw new Error(`Banco "${nomeBanco}" não é scratch/ci.`);
  }

  const versao = await prisma.$queryRawUnsafe<{ v: string }[]>(
    'SELECT VERSION() AS v',
  );
  const coluna = await prisma.$queryRawUnsafe<
    {
      COLUMN_NAME: string;
      IS_NULLABLE: string;
      COLUMN_TYPE: string;
      COLUMN_DEFAULT: string | null;
    }[]
  >(
    `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_TYPE, COLUMN_DEFAULT
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orcamento'
       AND COLUMN_NAME = 'contato_id'`,
  );
  const indice = await prisma.$queryRawUnsafe<
    { INDEX_NAME: string; NON_UNIQUE: number; COLUMN_NAME: string }[]
  >(
    `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orcamento'
       AND COLUMN_NAME = 'contato_id'`,
  );
  const fk = await prisma.$queryRawUnsafe<
    {
      CONSTRAINT_NAME: string;
      DELETE_RULE: string;
      UPDATE_RULE: string;
      REFERENCED_TABLE_NAME: string;
    }[]
  >(
    `SELECT rc.CONSTRAINT_NAME, rc.DELETE_RULE, rc.UPDATE_RULE, rc.REFERENCED_TABLE_NAME
     FROM information_schema.REFERENTIAL_CONSTRAINTS rc
     WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
       AND rc.TABLE_NAME = 'orcamento'
       AND rc.REFERENCED_TABLE_NAME = 'cliente_contato'`,
  );
  const mig = await prisma.$queryRawUnsafe<
    { migration_name: string; finished_at: Date | null }[]
  >(
    `SELECT migration_name, finished_at
     FROM _prisma_migrations
     WHERE migration_name LIKE '%20260805120800%'
        OR migration_name LIKE '%contato%'
     ORDER BY finished_at DESC`,
  );

  console.log(
    JSON.stringify(
      {
        host: new URL(url).host,
        banco: nomeBanco,
        versao: versao[0]?.v,
        coluna,
        indice,
        fk,
        migrations_contato: mig.map((m) => ({
          migration_name: m.migration_name,
          finished_at: m.finished_at,
        })),
      },
      (_k, v) => (typeof v === 'bigint' ? Number(v) : v),
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
