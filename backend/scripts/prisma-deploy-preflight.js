#!/usr/bin/env node

/* Preflight conservador para bancos legados antes de `prisma migrate deploy`. */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { Prisma, PrismaClient } = require('@prisma/client');

const APPLY = process.argv.includes('--apply');
const AUDIT_LEGACY = process.argv.includes('--audit-legacy');
const prisma = new PrismaClient();
const migrationsDir = path.resolve(__dirname, '..', 'prisma', 'migrations');

const ARTE_BASELINE = '20260626110000_create_arte_operacional_legacy_baseline';
const LEGACY_RECONCILIATION = '20260715170000_reconcile_legacy_schema';

const arteTables = [
  'arte_versoes',
  'arte_arquivos',
  'arte_comentarios',
  'arte_links_aprovacao',
  'arte_mensagens',
];

const reconciliationTables = [
  'acessolink', 'aprovacaoorcamento', 'categoriainsumo', 'checklists_os',
  'estoque', 'estoque_itens', 'estoque_localizacoes', 'estoque_lotes',
  'estoque_movimentacoes', 'estoque_transferencias', 'execucoes_regras',
  'historicoorcamento', 'linkpublico', 'mensagemchat', 'movimentacoes_os',
  'ordem_servico_logs', 'perfil_acesso', 'perfil_permissao', 'regras_validacao',
  'usuario_perfil', 'versaoorcamento', 'workflow_instancia_setor',
];

const retiredInventoryTables = [
  'inventory_locations', 'inventory_lots', 'inventory_movements', 'inventory_stock',
];

const requiredLegacyColumns = {
  cliente: ['ativo'],
  document_sequences: ['tipo', 'ano', 'ultimo_numero'],
  fornecedor: ['ativo'],
  funcao: ['ativo', 'setup_min', 'tipo_calculo'],
  insumos: ['codigo', 'descricao', 'estoque_atual'],
  maquina: ['ativo'],
  orcamento: [
    'alertas', 'aprovado_por', 'ativo', 'categoria', 'comissao_percentual',
    'condicoes_comerciais', 'configuracao_calculo', 'custos', 'custos_calculados',
    'data_aprovacao', 'data_atualizacao', 'data_criacao', 'data_limite',
    'data_ultimo_calculo', 'detalhamento_calculo', 'excluido_em', 'excluido_por',
    'motivo_exclusao', 'motivo_rejeicao', 'observacoes_internas', 'ordem',
    'prioridade', 'responsavel_id', 'tags', 'tipo_orcamento', 'titulo',
    'valor_total', 'versao_atual',
  ],
  servico_manual: ['ativo', 'categorias', 'setup_min', 'tipo_calculo'],
  template_produtos: ['valor_calculado'],
  usuario: ['ativo', 'nome'],
};

// O baseline 170000 deve ser validado contra a estrutura existente naquele
// ponto do histórico, não contra o schema.prisma atual. Estas colunas surgem
// somente na migration 194510; exigi-las antes de resolver o baseline impede
// justamente que a migration aditiva responsável por criá-las seja executada.
const columnsIntroducedAfterLegacyReconciliation = {
  workflow_instancia_setor: ['loja_id', 'workflow_id'],
};

const knownChecksumRepairs = {
  '20250926130000_add_document_sequences': [
    'e99b57599741463bdffcb03268784532a6855cfc5d09484c5228df370f4e88c1',
  ],
  '20260702140000_instalacao_conclusao_gestao': [
    'be65a01ddbe10bafe0abff6cd7767d181c797e6e8754bc121292b37026b7bd22',
  ],
};

function log(message) {
  process.stdout.write(`[prisma-preflight] ${message}\n`);
}

function block(message, details = []) {
  process.stderr.write(`[prisma-preflight] BLOQUEADO: ${message}\n`);
  for (const detail of details) process.stderr.write(`  - ${detail}\n`);
  process.exitCode = 1;
}

function checksumFor(migrationName) {
  const file = path.join(migrationsDir, migrationName, 'migration.sql');
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

async function loadTables() {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT TABLE_NAME AS table_name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()',
  );
  return new Set(rows.map((row) => String(row.table_name).toLowerCase()));
}

async function loadColumns() {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()',
  );
  const result = new Map();
  for (const row of rows) {
    const table = String(row.table_name).toLowerCase();
    if (!result.has(table)) result.set(table, new Set());
    result.get(table).add(String(row.column_name).toLowerCase());
  }
  return result;
}

async function loadMigrationRows() {
  try {
    return await prisma.$queryRawUnsafe(
      'SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations',
    );
  } catch (error) {
    if (
      error?.meta?.code === '1146' ||
      String(error.message).includes("doesn't exist") ||
      String(error.message).includes('does not exist')
    ) return [];
    throw error;
  }
}

function isApplied(rows, migrationName) {
  return rows.some((row) =>
    row.migration_name === migrationName && row.finished_at !== null && row.rolled_back_at === null,
  );
}

function runPrisma(args) {
  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(executable, ['prisma', ...args], {
    cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error(`Prisma encerrou com codigo ${result.status}`);
}

async function resolveApplied(migrationName) {
  if (!APPLY) {
    log(`${migrationName}: compativel; seria registrada como aplicada (modo check).`);
    return;
  }
  log(`${migrationName}: schema compativel; registrando como aplicada.`);
  runPrisma(['migrate', 'resolve', '--applied', migrationName]);
}

function dmmfRequirements(tableNames) {
  const wanted = new Set(tableNames.map((name) => name.toLowerCase()));
  const result = new Map();
  for (const model of Prisma.dmmf.datamodel.models) {
    const table = String(model.dbName || model.name).toLowerCase();
    if (!wanted.has(table)) continue;
    result.set(table, model.fields
      .filter((field) => field.kind !== 'object')
      .map((field) => String(field.dbName || field.name).toLowerCase()));
  }
  return result;
}

function legacyReconciliationRequirements(tableNames) {
  const result = dmmfRequirements(tableNames);
  for (const [table, laterColumns] of Object.entries(
    columnsIntroducedAfterLegacyReconciliation,
  )) {
    const required = result.get(table);
    if (!required) continue;
    const introducedLater = new Set(laterColumns);
    result.set(
      table,
      required.filter((column) => !introducedLater.has(column)),
    );
  }
  return result;
}

function findMissingColumns(columns, requirements) {
  const missing = [];
  for (const [table, names] of requirements) {
    const existing = columns.get(table) || new Set();
    for (const name of names) {
      if (!existing.has(name.toLowerCase())) missing.push(`${table}.${name}`);
    }
  }
  return missing;
}

async function repairKnownChecksums(rows) {
  for (const [migrationName, acceptedOld] of Object.entries(knownChecksumRepairs)) {
    const applied = rows.filter((row) =>
      row.migration_name === migrationName && row.finished_at !== null && row.rolled_back_at === null,
    );
    if (!applied.length) continue;
    const current = checksumFor(migrationName);
    if (applied.some((row) => row.checksum !== current && !acceptedOld.includes(row.checksum))) {
      block(`checksum desconhecido em ${migrationName}; revisao manual obrigatoria.`);
      return;
    }
    if (!applied.some((row) => row.checksum !== current)) continue;
    if (!APPLY) {
      log(`${migrationName}: checksum conhecido seria alinhado (modo check).`);
      continue;
    }
    await prisma.$executeRawUnsafe(
      'UPDATE _prisma_migrations SET checksum = ? WHERE migration_name = ? AND finished_at IS NOT NULL AND rolled_back_at IS NULL',
      current, migrationName,
    );
    log(`${migrationName}: checksum historico conhecido alinhado.`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL nao definida.');
  const [tables, columns, rows] = await Promise.all([
    loadTables(), loadColumns(), loadMigrationRows(),
  ]);
  const appliedCount = rows.filter((row) =>
    row.finished_at !== null && row.rolled_back_at === null,
  ).length;
  log(`modo=${APPLY ? 'apply' : 'check'}; migrations aplicadas=${appliedCount}.`);

  if (appliedCount === 0) {
    log('Banco novo detectado; historico completo sera aplicado normalmente.');
    return;
  }

  if (AUDIT_LEGACY || !isApplied(rows, ARTE_BASELINE)) {
    const present = arteTables.filter((table) => tables.has(table));
    if (present.length === arteTables.length) {
      const missing = findMissingColumns(columns, dmmfRequirements(arteTables));
      if (missing.length) {
        block('tabelas de Arte existem, mas estao incompletas.', missing);
        return;
      }
      await resolveApplied(ARTE_BASELINE);
    } else if (present.length === 0) {
      log(`${ARTE_BASELINE}: tabelas ausentes; migration aditiva podera executar.`);
    } else {
      block('baseline de Arte parcialmente materializada.', [
        `presentes: ${present.join(', ')}`,
        `ausentes: ${arteTables.filter((table) => !tables.has(table)).join(', ')}`,
      ]);
      return;
    }
  }

  if (AUDIT_LEGACY || !isApplied(rows, LEGACY_RECONCILIATION)) {
    const missingTables = reconciliationTables.filter((table) => !tables.has(table));
    const retiredPresent = retiredInventoryTables.filter((table) => tables.has(table));
    const explicit = new Map(Object.entries(requiredLegacyColumns));
    const missing = [
      ...findMissingColumns(
        columns,
        legacyReconciliationRequirements(reconciliationTables),
      ),
      ...findMissingColumns(columns, explicit),
    ];
    if (columns.get('document_sequences')?.has('tipo_documento')) {
      missing.push('document_sequences.tipo_documento ainda existe');
    }
    if (missingTables.length || retiredPresent.length || missing.length) {
      block(
        `${LEGACY_RECONCILIATION} pendente em banco existente com schema divergente. Backup e auditoria manual obrigatorios.`,
        [
          ...(missingTables.length ? [`tabelas ausentes: ${missingTables.join(', ')}`] : []),
          ...(retiredPresent.length ? [`tabelas antigas presentes: ${retiredPresent.join(', ')}`] : []),
          ...missing.map((item) => `estrutura ausente: ${item}`),
        ],
      );
      return;
    }
    await resolveApplied(LEGACY_RECONCILIATION);
  }

  if (process.exitCode) return;
  await repairKnownChecksums(rows);
  if (!process.exitCode) log('Preflight concluido; migrate deploy autorizado.');
}

if (require.main === module) {
  main()
    .catch((error) => block(error.message || String(error)))
    .finally(async () => prisma.$disconnect());
}

module.exports = {
  findMissingColumns,
  legacyReconciliationRequirements,
};
