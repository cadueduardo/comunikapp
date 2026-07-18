#!/usr/bin/env node

/**
 * Fase 2 (caminho sem colisões) da matriz Insumo x Fornecedor.
 *
 * Este aplicador não mescla nem exclui insumos. Se houver qualquer nome
 * duplicado por loja segundo a collation do MySQL, a execução é bloqueada.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');

const CONFIRMATION = 'APLICAR_BACKFILL_MATRIZ';
const DATABASE_NAME_PATTERN = /^[A-Za-z0-9_]+$/;

function parseArgs(argv) {
  const options = {
    apply: false,
    confirmation: null,
    backup: null,
    lojaId: null,
    outputDir: path.resolve(__dirname, 'reports'),
    writeReports: true,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') continue;
    if (arg === '--apply') {
      options.apply = true;
      continue;
    }
    if (arg === '--no-write-reports') {
      options.writeReports = false;
      continue;
    }
    if (arg.startsWith('--confirmation=')) {
      options.confirmation = arg.slice('--confirmation='.length);
      continue;
    }
    if (arg.startsWith('--backup=')) {
      options.backup = path.resolve(arg.slice('--backup='.length));
      continue;
    }
    if (arg.startsWith('--loja-id=')) {
      options.lojaId = arg.slice('--loja-id='.length).trim();
      if (!options.lojaId) throw new Error('--loja-id exige um ID.');
      continue;
    }
    if (arg.startsWith('--output-dir=')) {
      const value = arg.slice('--output-dir='.length).trim();
      if (!value) throw new Error('--output-dir exige um caminho.');
      options.outputDir = path.resolve(value);
      continue;
    }
    throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (options.apply) {
    if (options.confirmation !== CONFIRMATION) {
      throw new Error(`--apply exige --confirmation=${CONFIRMATION}.`);
    }
    validateBackup(options.backup);
  } else if (options.confirmation || options.backup) {
    throw new Error(
      '--confirmation e --backup so podem ser usados com --apply.',
    );
  }

  return options;
}

function validateBackup(backupPath) {
  if (!backupPath) throw new Error('--apply exige --backup=<arquivo.sql.gz>.');
  if (!backupPath.endsWith('.sql.gz')) {
    throw new Error('O backup deve terminar com .sql.gz.');
  }
  const stat = fs.statSync(backupPath, { throwIfNoEntry: false });
  if (!stat?.isFile() || stat.size === 0) {
    throw new Error('Backup ausente ou vazio.');
  }
  const gzip = spawnSync('gzip', ['-t', backupPath], {
    encoding: 'utf8',
  });
  if (gzip.status !== 0) {
    throw new Error(`Backup gzip invalido: ${(gzip.stderr || '').trim()}`);
  }
}

function databaseName(databaseUrl) {
  const url = new URL(databaseUrl);
  const name = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!DATABASE_NAME_PATTERN.test(name)) {
    throw new Error('Nome do banco fora do padrao seguro.');
  }
  return name;
}

function scopeWhere(alias, lojaId) {
  return lojaId ? `WHERE ${alias}.loja_id = ?` : '';
}

function scopeParams(lojaId) {
  return lojaId ? [lojaId] : [];
}

function toNumber(value) {
  return Number(value ?? 0);
}

async function inspect(tx, options) {
  const params = scopeParams(options.lojaId);
  const table = await tx.$queryRawUnsafe(
    `SELECT COUNT(*) AS total
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'insumo_fornecedores'`,
  );
  if (toNumber(table[0]?.total) !== 1) {
    throw new Error(
      'Tabela insumo_fornecedores ausente. A Fase 1 deve ser aplicada primeiro.',
    );
  }

  const duplicateGroups = await tx.$queryRawUnsafe(
    `SELECT i.loja_id, MIN(i.nome) AS nome, COUNT(*) AS total
       FROM insumos i
       ${scopeWhere('i', options.lojaId)}
      GROUP BY i.loja_id, i.nome
     HAVING COUNT(*) > 1
      ORDER BY i.loja_id, nome`,
    ...params,
  );

  const invalidSuppliers = await tx.$queryRawUnsafe(
    `SELECT
        i.id AS insumo_id,
        i.loja_id,
        i.fornecedorId AS fornecedor_id,
        f.loja_id AS fornecedor_loja_id,
        f.ativo AS fornecedor_ativo,
        f.tipo AS fornecedor_tipo
       FROM insumos i
       LEFT JOIN fornecedor f ON f.id = i.fornecedorId
       ${scopeWhere('i', options.lojaId)}
      HAVING
        fornecedor_id IS NULL
        OR fornecedor_loja_id IS NULL
        OR fornecedor_loja_id <> loja_id
        OR fornecedor_ativo <> 1
        OR fornecedor_tipo NOT IN ('INSUMO', 'AMBOS')
      ORDER BY i.loja_id, i.id`,
    ...params,
  );

  const counts = await tx.$queryRawUnsafe(
    `SELECT
        i.loja_id,
        COUNT(*) AS total_insumos,
        SUM(CASE WHEN m.insumo_id IS NULL THEN 1 ELSE 0 END) AS sem_matriz,
        SUM(
          CASE
            WHEN m.insumo_id IS NOT NULL
             AND (
               m.loja_id <> i.loja_id
               OR m.fornecedor_id <> i.fornecedorId
               OR m.preco_custo <> i.custo_unitario
               OR m.padrao <> 1
             )
            THEN 1 ELSE 0
          END
        ) AS matriz_padrao_divergente
       FROM insumos i
       LEFT JOIN insumo_fornecedores m
         ON m.insumo_id = i.id
        AND m.fornecedor_id = i.fornecedorId
       ${scopeWhere('i', options.lojaId)}
      GROUP BY i.loja_id
      ORDER BY i.loja_id`,
    ...params,
  );

  return {
    duplicate_groups: duplicateGroups.map((row) => ({
      loja_id: String(row.loja_id),
      nome: row.nome,
      total: toNumber(row.total),
    })),
    invalid_suppliers: invalidSuppliers.map((row) => ({
      insumo_id: String(row.insumo_id),
      loja_id: String(row.loja_id),
      fornecedor_id:
        row.fornecedor_id === null ? null : String(row.fornecedor_id),
      fornecedor_loja_id:
        row.fornecedor_loja_id === null ? null : String(row.fornecedor_loja_id),
      fornecedor_ativo:
        row.fornecedor_ativo === null ? null : Boolean(row.fornecedor_ativo),
      fornecedor_tipo: row.fornecedor_tipo,
    })),
    lojas: counts.map((row) => ({
      loja_id: String(row.loja_id),
      total_insumos: toNumber(row.total_insumos),
      sem_matriz: toNumber(row.sem_matriz),
      matriz_padrao_divergente: toNumber(row.matriz_padrao_divergente),
    })),
  };
}

function assertCanApply(inspection) {
  if (inspection.duplicate_groups.length) {
    throw new Error(
      `Backfill bloqueado: ${inspection.duplicate_groups.length} grupo(s) duplicado(s). Nenhuma deduplicacao automatica sera feita.`,
    );
  }
  if (inspection.invalid_suppliers.length) {
    throw new Error(
      `Backfill bloqueado: ${inspection.invalid_suppliers.length} fornecedor(es) legado(s) incompativel(is).`,
    );
  }
}

async function validateInvariants(tx, options) {
  const params = scopeParams(options.lojaId);
  const violations = await tx.$queryRawUnsafe(
    `SELECT i.id
       FROM insumos i
       LEFT JOIN insumo_fornecedores m ON m.insumo_id = i.id
       ${scopeWhere('i', options.lojaId)}
      GROUP BY
        i.id, i.loja_id, i.fornecedorId, i.custo_unitario
     HAVING
        COUNT(m.fornecedor_id) < 1
        OR SUM(m.padrao = 1) <> 1
        OR SUM(
          m.padrao = 1
          AND m.loja_id = i.loja_id
          AND m.fornecedor_id = i.fornecedorId
          AND m.preco_custo = i.custo_unitario
        ) <> 1`,
    ...params,
  );
  if (violations.length) {
    throw new Error(
      `Invariantes violadas para ${violations.length} insumo(s).`,
    );
  }
}

async function applyBackfill(prisma, options) {
  const lockName = options.lojaId
    ? `comunikapp:matriz:${options.lojaId}`
    : 'comunikapp:matriz:global';
  const acquired = await prisma.$queryRawUnsafe(
    'SELECT GET_LOCK(?, 0) AS acquired',
    lockName,
  );
  if (toNumber(acquired[0]?.acquired) !== 1) {
    throw new Error('Outra execucao da matriz esta em andamento.');
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const params = scopeParams(options.lojaId);
        await tx.$queryRawUnsafe(
          `SELECT i.id
             FROM insumos i
             ${scopeWhere('i', options.lojaId)}
            ORDER BY i.id
            FOR UPDATE`,
          ...params,
        );

        const before = await inspect(tx, options);
        assertCanApply(before);

        const alternateScope = options.lojaId ? 'AND i.loja_id = ?' : '';
        await tx.$executeRawUnsafe(
          `UPDATE insumo_fornecedores m
             JOIN insumos i ON i.id = m.insumo_id
              SET m.padrao = 0,
                  m.updatedAt = NOW(3)
            WHERE m.padrao = 1
              AND m.fornecedor_id <> i.fornecedorId
              ${alternateScope}`,
          ...scopeParams(options.lojaId),
        );

        const storeFilter = options.lojaId ? 'WHERE i.loja_id = ?' : '';
        const result = await tx.$executeRawUnsafe(
          `INSERT INTO insumo_fornecedores (
             loja_id,
             insumo_id,
             fornecedor_id,
             preco_custo,
             codigo_ref,
             padrao,
             createdAt,
             updatedAt
           )
           SELECT
             i.loja_id,
             i.id,
             i.fornecedorId,
             i.custo_unitario,
             NULL,
             TRUE,
             NOW(3),
             NOW(3)
           FROM insumos i
           ${storeFilter}
           ON DUPLICATE KEY UPDATE
             updatedAt = IF(
               insumo_fornecedores.loja_id <> VALUES(loja_id)
               OR insumo_fornecedores.preco_custo <> VALUES(preco_custo)
               OR insumo_fornecedores.padrao <> TRUE,
               NOW(3),
               insumo_fornecedores.updatedAt
             ),
             loja_id = VALUES(loja_id),
             preco_custo = VALUES(preco_custo),
             padrao = TRUE`,
          ...scopeParams(options.lojaId),
        );

        await validateInvariants(tx, options);
        const after = await inspect(tx, options);
        return { affected_rows: toNumber(result), before, after };
      },
      { timeout: 60_000 },
    );
  } finally {
    await prisma.$queryRawUnsafe('SELECT RELEASE_LOCK(?)', lockName);
  }
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
}

function buildReport(mode, database, options, details) {
  return {
    version: 1,
    generated_at: new Date().toISOString(),
    mode,
    database,
    scope: { loja_id: options.lojaId },
    backup: options.apply ? path.basename(options.backup) : null,
    details,
  };
}

function writeReport(report, options) {
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (!options.writeReports) {
    process.stdout.write(json);
    return null;
  }
  fs.mkdirSync(options.outputDir, { recursive: true });
  const output = path.join(
    options.outputDir,
    `insumo-fornecedor-backfill-${timestampForFile()}.json`,
  );
  fs.writeFileSync(output, json, { encoding: 'utf8', mode: 0o600 });
  process.stdout.write(`[matriz-backfill] Relatorio: ${output}\n`);
  return output;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL nao definida.');
  const database = databaseName(process.env.DATABASE_URL);
  const prisma = new PrismaClient();

  try {
    if (!options.apply) {
      const inspection = await inspect(prisma, options);
      assertCanApply(inspection);
      writeReport(
        buildReport('dry-run-read-only', database, options, inspection),
        options,
      );
      process.stdout.write('[matriz-backfill] DRY_RUN_APROVADO\n');
      return;
    }

    const details = await applyBackfill(prisma, options);
    writeReport(
      buildReport('apply-backfill', database, options, details),
      options,
    );
    process.stdout.write('[matriz-backfill] APPLY_APROVADO\n');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[matriz-backfill] BLOQUEADO: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  CONFIRMATION,
  assertCanApply,
  buildReport,
  databaseName,
  parseArgs,
};
