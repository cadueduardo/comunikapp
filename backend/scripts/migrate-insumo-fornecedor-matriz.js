#!/usr/bin/env node

/**
 * Fase 0 da matriz Insumo x Fornecedor.
 *
 * Este script e deliberadamente somente leitura. Nao existe modo --apply:
 * qualquer argumento de escrita e rejeitado antes da conexao com o banco.
 */

const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');

const DIRECT_REFERENCES = [
  ['historico_preco_insumos', 'insumo_id'],
  ['item_template_produtos', 'insumo_id'],
  ['itemorcamento', 'insumo_id'],
  ['iteminsumo', 'insumo_id'],
  ['estoque', 'insumo_id'],
  ['estoque_itens', 'insumoId'],
  ['estoque_sobras', 'insumo_id'],
  ['estoque_aproveitamentos', 'insumo_id'],
];

const STOCK_CHILDREN = [
  ['estoque_movimentacoes', 'estoqueId'],
  ['estoque_lotes', 'estoqueId'],
  ['estoque_transferencias', 'estoqueId'],
  ['estoque_sobras', 'estoque_id'],
];

const MUTABLE_ITEM_OS_STATUSES = new Set([
  'PENDENTE',
  'BLOQUEADO_AGUARDANDO_SINAL',
  'LIBERADO',
  'EM_PRODUCAO',
]);

function parseArgs(argv) {
  const options = {
    lojaId: null,
    outputDir: path.resolve(__dirname, 'reports'),
    writeReports: true,
  };

  for (const arg of argv) {
    if (arg === '--dry-run') continue;
    if (arg === '--apply' || arg.startsWith('--apply=')) {
      throw new Error('Fase 0 e somente leitura: --apply nao e suportado.');
    }
    if (arg === '--no-write-reports') {
      options.writeReports = false;
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

  return options;
}

function assertReadOnlySql(sql) {
  const normalized = String(sql)
    .replace(/^\s*(?:\/\*[\s\S]*?\*\/\s*)*/, '')
    .trim();
  if (!/^(SELECT|SHOW|DESCRIBE|EXPLAIN)\b/i.test(normalized)) {
    throw new Error(`Query bloqueada no dry-run: ${normalized.slice(0, 32)}`);
  }
  if (
    /\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|DROP|TRUNCATE|CREATE|RENAME|CALL|LOAD|GRANT|REVOKE|LOCK|UNLOCK)\b/i.test(
      normalized,
    )
  ) {
    throw new Error('Query de escrita/DDL bloqueada no dry-run.');
  }
}

function decimalToNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function selectSurvivor(candidates) {
  if (!candidates.length) throw new Error('Grupo sem candidatos.');
  return [...candidates].sort((left, right) => {
    if (Boolean(left.ativo) !== Boolean(right.ativo)) {
      return left.ativo ? -1 : 1;
    }
    const stockDifference =
      decimalToNumber(right.estoque_total) -
      decimalToNumber(left.estoque_total);
    if (stockDifference !== 0) return stockDifference;
    const dateDifference =
      new Date(left.criado_em).getTime() - new Date(right.criado_em).getTime();
    if (dateDifference !== 0) return dateDifference;
    return String(left.id).localeCompare(String(right.id), 'en');
  })[0];
}

function survivorReason(candidates, survivor) {
  const activeCount = candidates.filter((item) => item.ativo).length;
  const activePool = activeCount
    ? candidates.filter((item) => item.ativo)
    : candidates;
  if (activePool.length !== candidates.length) return 'ativo=true';

  const highestStock = Math.max(
    ...activePool.map((item) => decimalToNumber(item.estoque_total)),
  );
  const stockPool = activePool.filter(
    (item) => decimalToNumber(item.estoque_total) === highestStock,
  );
  if (stockPool.length !== activePool.length) return 'maior estoque fisico';

  const oldest = Math.min(
    ...stockPool.map((item) => new Date(item.criado_em).getTime()),
  );
  const datePool = stockPool.filter(
    (item) => new Date(item.criado_em).getTime() === oldest,
  );
  if (datePool.length !== stockPool.length) return 'criado_em mais antigo';
  return `menor ID alfanumerico (${survivor.id})`;
}

function walkJson(value, callback, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walkJson(item, callback, [...pathParts, index]),
    );
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      callback(item, [...pathParts, key], key);
      walkJson(item, callback, [...pathParts, key]);
    }
  }
}

function analyzeJson(raw, secondaryIds) {
  if (raw === null || raw === undefined || raw === '') {
    return { valid: true, occurrences: [], unknownShapes: [] };
  }

  let parsed;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      occurrences: [],
      unknownShapes: [],
    };
  }

  const occurrences = [];
  const unknownShapes = [];
  const knownKeys = new Set(['insumo_id', 'insumoId', 'id_insumo']);
  walkJson(parsed, (value, jsonPath, key) => {
    if (!secondaryIds.has(String(value))) return;
    const occurrence = {
      insumo_id: String(value),
      path: jsonPath.join('.'),
      key,
    };
    occurrences.push(occurrence);
    if (!knownKeys.has(key)) unknownShapes.push(occurrence);
  });

  return { valid: true, occurrences, unknownShapes };
}

function placeholders(length) {
  if (!length) throw new Error('Lista vazia nao pode gerar placeholders.');
  return Array.from({ length }, () => '?').join(', ');
}

function safeIdentifier(identifier) {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error(`Identificador SQL invalido: ${identifier}`);
  }
  return `\`${identifier}\``;
}

function normalizeForJson(_key, value) {
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toJSON === 'function') return value.toJSON();
  return value;
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
}

function markdownSummary(report) {
  const lines = [
    '# Dry-run — Matriz Insumo × Fornecedor',
    '',
    `- Gerado em: ${report.generated_at}`,
    `- Escopo: ${report.scope.loja_id || 'todas as lojas'}`,
    `- Modo: somente leitura`,
    `- Lojas analisadas: ${report.summary.lojas}`,
    `- Grupos colidentes: ${report.summary.grupos}`,
    `- Insumos secundarios: ${report.summary.insumos_secundarios}`,
    `- JSONs invalidos: ${report.summary.jsons_invalidos}`,
    `- Shapes JSON desconhecidos: ${report.summary.shapes_desconhecidos}`,
    '',
    '## Estimativa de operações para uma futura Fase 2',
    '',
    `- Inserts: ${report.summary.estimated_operations.inserts}`,
    `- Updates: ${report.summary.estimated_operations.updates}`,
    `- Deletes: ${report.summary.estimated_operations.deletes}`,
    '',
  ];

  for (const store of report.lojas) {
    lines.push(`## Loja ${store.loja_id}`, '');
    if (!store.grupos.length) {
      lines.push('Nenhuma colisão encontrada.', '');
      continue;
    }
    for (const group of store.grupos) {
      lines.push(
        `### ${group.nome_representativo}`,
        '',
        `- Sobrevivente: \`${group.sobrevivente.id}\` (${group.justificativa})`,
        `- Secundários: ${group.secundarios.map((item) => `\`${item.id}\``).join(', ')}`,
        `- Referências diretas: ${group.totais.referencias_diretas}`,
        `- Ocorrências JSON mutáveis: ${group.totais.json_mutaveis}`,
        `- Ocorrências JSON snapshot: ${group.totais.json_snapshots}`,
        `- Conflitos fornecedor/preço: ${group.conflitos_matriz.length}`,
        '',
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

async function buildReport(prisma, options) {
  async function query(sql, ...params) {
    assertReadOnlySql(sql);
    return prisma.$queryRawUnsafe(sql, ...params);
  }

  const tableRows = await query(
    'SELECT TABLE_NAME AS table_name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()',
  );
  const tables = new Map(
    tableRows.map((row) => [
      String(row.table_name).toLowerCase(),
      String(row.table_name),
    ]),
  );
  const requiredTables = ['insumos', 'fornecedor', 'estoque_itens'];
  const missing = requiredTables.filter((table) => !tables.has(table));
  if (missing.length) {
    throw new Error(`Tabelas obrigatorias ausentes: ${missing.join(', ')}`);
  }

  const storeClause = options.lojaId ? 'WHERE i.loja_id = ?' : '';
  const storeParams = options.lojaId ? [options.lojaId] : [];
  const storeInventory = await query(
    `SELECT i.loja_id, COUNT(*) AS total_insumos
       FROM insumos i
       ${storeClause}
      GROUP BY i.loja_id
      ORDER BY i.loja_id`,
    ...storeParams,
  );
  const duplicateCandidates = await query(
    `
      SELECT
        duplicate_groups.representative_id AS group_id,
        i.id,
        i.loja_id,
        i.nome,
        i.ativo,
        i.criado_em,
        i.fornecedorId AS fornecedor_id,
        f.nome AS fornecedor_nome,
        i.custo_unitario,
        COALESCE(SUM(stock.quantidadeAtual), 0) AS estoque_total
      FROM (
        SELECT i.loja_id, MIN(i.id) AS representative_id
        FROM insumos i
        ${storeClause}
        GROUP BY i.loja_id, i.nome
        HAVING COUNT(*) > 1
      ) duplicate_groups
      JOIN insumos representative
        ON representative.id = duplicate_groups.representative_id
      JOIN insumos i
        ON i.loja_id = representative.loja_id
       AND i.nome = representative.nome
      JOIN fornecedor f ON f.id = i.fornecedorId
      LEFT JOIN estoque_itens stock
        ON stock.insumoId = i.id
       AND stock.lojaId = i.loja_id
      GROUP BY
        duplicate_groups.representative_id,
        i.id, i.loja_id, i.nome, i.ativo, i.criado_em,
        i.fornecedorId, f.nome, i.custo_unitario
      ORDER BY i.loja_id, duplicate_groups.representative_id, i.id
    `,
    ...storeParams,
  );

  const groups = new Map();
  for (const row of duplicateCandidates) {
    const key = `${row.loja_id}:${row.group_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const stores = new Map(
    storeInventory.map((store) => [
      String(store.loja_id),
      {
        loja_id: String(store.loja_id),
        total_insumos: Number(store.total_insumos),
        grupos: [],
      },
    ]),
  );
  const totals = {
    lojas: stores.size,
    grupos: 0,
    insumos_secundarios: 0,
    jsons_invalidos: 0,
    shapes_desconhecidos: 0,
    estimated_operations: { inserts: 0, updates: 0, deletes: 0 },
  };

  for (const candidates of groups.values()) {
    const survivor = selectSurvivor(candidates);
    const secondary = candidates.filter((item) => item.id !== survivor.id);
    const allIds = candidates.map((item) => String(item.id));
    const secondaryIds = new Set(secondary.map((item) => String(item.id)));
    const params = placeholders(secondary.length);

    const directReferences = [];
    for (const [logicalTable, column] of DIRECT_REFERENCES) {
      const actualTable = tables.get(logicalTable);
      if (!actualTable) {
        directReferences.push({
          table: logicalTable,
          column,
          status: 'tabela_ausente',
          records: [],
        });
        continue;
      }
      const rows = await query(
        `SELECT id, ${safeIdentifier(column)} AS insumo_id
           FROM ${safeIdentifier(actualTable)}
          WHERE ${safeIdentifier(column)} IN (${params})`,
        ...secondary.map((item) => String(item.id)),
      );
      directReferences.push({
        table: actualTable,
        column,
        status: 'ok',
        records: rows.map((row) => ({
          id: String(row.id),
          insumo_id: String(row.insumo_id),
        })),
      });
    }

    const stockRows = await query(
      `SELECT *
         FROM estoque_itens
        WHERE lojaId = ? AND insumoId IN (${placeholders(allIds.length)})
        ORDER BY localizacaoId, createdAt, id`,
      survivor.loja_id,
      ...allIds,
    );
    const stockItemIds = stockRows.map((row) => String(row.id));
    const stockChildren = [];
    for (const [logicalTable, column] of STOCK_CHILDREN) {
      const actualTable = tables.get(logicalTable);
      if (!actualTable || !stockItemIds.length) {
        stockChildren.push({
          table: logicalTable,
          column,
          status: actualTable ? 'sem_itens' : 'tabela_ausente',
          records: [],
        });
        continue;
      }
      const rows = await query(
        `SELECT id, ${safeIdentifier(column)} AS estoque_id
           FROM ${safeIdentifier(actualTable)}
          WHERE ${safeIdentifier(column)} IN (${placeholders(stockItemIds.length)})`,
        ...stockItemIds,
      );
      stockChildren.push({
        table: actualTable,
        column,
        status: 'ok',
        records: rows.map((row) => ({
          id: String(row.id),
          estoque_id: String(row.estoque_id),
        })),
      });
    }

    const byLocation = new Map();
    for (const item of stockRows) {
      const key = String(item.localizacaoId);
      if (!byLocation.has(key)) byLocation.set(key, []);
      byLocation.get(key).push(item);
    }
    const stockPlan = [...byLocation.entries()].map(([locationId, items]) => {
      const existingSurvivor = items.find(
        (item) => String(item.insumoId) === String(survivor.id),
      );
      const target = existingSurvivor || items[0];
      return {
        localizacao_id: locationId,
        action: items.length === 1 ? 'update_simples' : 'consolidacao',
        target_estoque_id: String(target.id),
        source_estoque_ids: items
          .filter((item) => String(item.id) !== String(target.id))
          .map((item) => String(item.id)),
        quantidade_atual_total: items.reduce(
          (sum, item) => sum + decimalToNumber(item.quantidadeAtual),
          0,
        ),
        quantidade_reservada_total: items.reduce(
          (sum, item) => sum + decimalToNumber(item.quantidadeReservada),
          0,
        ),
      };
    });

    const jsonOccurrences = [];
    const invalidJson = [];
    const unknownShapes = [];
    const itemOsTable = tables.get('itemos');
    if (itemOsTable) {
      const rows = await query(
        `SELECT item.id, item.os_id, item.status_liberacao_pcp, item.insumos_necessarios
           FROM ${safeIdentifier(itemOsTable)} item
           JOIN ordens_servico os ON os.id = item.os_id
          WHERE os.loja_id = ? AND item.insumos_necessarios IS NOT NULL`,
        survivor.loja_id,
      );
      for (const row of rows) {
        const analysis = analyzeJson(row.insumos_necessarios, secondaryIds);
        if (!analysis.valid) {
          invalidJson.push({
            source: 'ItemOS.insumos_necessarios',
            id: String(row.id),
            error: analysis.error,
          });
          continue;
        }
        const classification = MUTABLE_ITEM_OS_STATUSES.has(
          String(row.status_liberacao_pcp || ''),
        )
          ? 'mutavel'
          : 'snapshot';
        analysis.occurrences.forEach((occurrence) =>
          jsonOccurrences.push({
            source: 'ItemOS.insumos_necessarios',
            id: String(row.id),
            os_id: String(row.os_id),
            classification,
            ...occurrence,
          }),
        );
        unknownShapes.push(
          ...analysis.unknownShapes.map((occurrence) => ({
            source: 'ItemOS.insumos_necessarios',
            id: String(row.id),
            ...occurrence,
          })),
        );
      }
    }

    const osRows = await query(
      `SELECT id, status, ativo, insumos_calculados
         FROM ordens_servico
        WHERE loja_id = ? AND insumos_calculados IS NOT NULL`,
      survivor.loja_id,
    );
    for (const row of osRows) {
      const analysis = analyzeJson(row.insumos_calculados, secondaryIds);
      if (!analysis.valid) {
        invalidJson.push({
          source: 'OrdemServico.insumos_calculados',
          id: String(row.id),
          error: analysis.error,
        });
        continue;
      }
      const classification =
        Boolean(row.ativo) &&
        !['FINALIZADA', 'CANCELADA'].includes(String(row.status).toUpperCase())
          ? 'mutavel'
          : 'snapshot';
      analysis.occurrences.forEach((occurrence) =>
        jsonOccurrences.push({
          source: 'OrdemServico.insumos_calculados',
          id: String(row.id),
          classification,
          ...occurrence,
        }),
      );
      unknownShapes.push(
        ...analysis.unknownShapes.map((occurrence) => ({
          source: 'OrdemServico.insumos_calculados',
          id: String(row.id),
          ...occurrence,
        })),
      );
    }

    const supplierGroups = new Map();
    for (const candidate of candidates) {
      const key = String(candidate.fornecedor_id);
      if (!supplierGroups.has(key)) supplierGroups.set(key, []);
      supplierGroups.get(key).push(candidate);
    }
    const matrixConflicts = [...supplierGroups.values()]
      .filter((items) => {
        const prices = new Set(
          items.map((item) => String(item.custo_unitario)),
        );
        return items.length > 1 && prices.size > 1;
      })
      .map((items) => ({
        fornecedor_id: String(items[0].fornecedor_id),
        fornecedor_nome: items[0].fornecedor_nome,
        candidatos: items.map((item) => ({
          insumo_id: String(item.id),
          preco_custo: decimalToNumber(item.custo_unitario),
        })),
      }));

    const directCount = directReferences.reduce(
      (sum, reference) => sum + reference.records.length,
      0,
    );
    const mutableJsonCount = jsonOccurrences.filter(
      (item) => item.classification === 'mutavel',
    ).length;
    const snapshotJsonCount = jsonOccurrences.length - mutableJsonCount;
    const childRepoints = stockChildren.reduce(
      (sum, child) => sum + child.records.length,
      0,
    );
    const consolidatedStockDeletes = stockPlan.reduce(
      (sum, item) => sum + item.source_estoque_ids.length,
      0,
    );

    const groupReport = {
      group_id: String(candidates[0].group_id),
      nome_representativo: candidates[0].nome,
      candidatos: candidates.map((item) => ({
        id: String(item.id),
        nome: item.nome,
        ativo: Boolean(item.ativo),
        criado_em: item.criado_em,
        fornecedor_id: String(item.fornecedor_id),
        fornecedor_nome: item.fornecedor_nome,
        custo_unitario: decimalToNumber(item.custo_unitario),
        estoque_total: decimalToNumber(item.estoque_total),
      })),
      sobrevivente: { id: String(survivor.id) },
      justificativa: survivorReason(candidates, survivor),
      secundarios: secondary.map((item) => ({ id: String(item.id) })),
      referencias_diretas: directReferences,
      estoque: {
        itens: stockRows,
        plano_por_localizacao: stockPlan,
        filhos: stockChildren,
      },
      json: {
        ocorrencias: jsonOccurrences,
        invalidos: invalidJson,
        shapes_desconhecidos: unknownShapes,
      },
      conflitos_matriz: matrixConflicts,
      totais: {
        referencias_diretas: directCount,
        filhos_estoque_reapontados: childRepoints,
        json_mutaveis: mutableJsonCount,
        json_snapshots: snapshotJsonCount,
      },
      estimated_operations: {
        inserts: new Set(candidates.map((item) => String(item.fornecedor_id)))
          .size,
        updates:
          directCount + childRepoints + mutableJsonCount + stockPlan.length,
        deletes: secondary.length + consolidatedStockDeletes,
      },
    };

    stores.get(String(survivor.loja_id)).grupos.push(groupReport);
    totals.grupos += 1;
    totals.insumos_secundarios += secondary.length;
    totals.jsons_invalidos += invalidJson.length;
    totals.shapes_desconhecidos += unknownShapes.length;
    for (const operation of ['inserts', 'updates', 'deletes']) {
      totals.estimated_operations[operation] +=
        groupReport.estimated_operations[operation];
    }
  }

  totals.estimated_operations.inserts +=
    storeInventory.reduce(
      (sum, store) => sum + Number(store.total_insumos),
      0,
    ) - duplicateCandidates.length;
  return {
    version: 1,
    generated_at: new Date().toISOString(),
    mode: 'dry-run-read-only',
    scope: { loja_id: options.lojaId },
    summary: totals,
    lojas: [...stores.values()],
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL nao definida.');
  }

  const prisma = new PrismaClient({
    transactionOptions: { timeout: 30_000 },
  });
  try {
    const report = await buildReport(prisma, options);
    const json = `${JSON.stringify(report, normalizeForJson, 2)}\n`;
    const markdown = markdownSummary(report);

    if (options.writeReports) {
      fs.mkdirSync(options.outputDir, { recursive: true });
      const stamp = timestampForFile();
      const base = `insumo-fornecedor-dry-run-${stamp}`;
      const jsonPath = path.join(options.outputDir, `${base}.json`);
      const markdownPath = path.join(options.outputDir, `${base}.md`);
      fs.writeFileSync(jsonPath, json, { encoding: 'utf8', mode: 0o600 });
      fs.writeFileSync(markdownPath, markdown, {
        encoding: 'utf8',
        mode: 0o600,
      });
      process.stdout.write(`[matriz-dry-run] JSON: ${jsonPath}\n`);
      process.stdout.write(`[matriz-dry-run] Resumo: ${markdownPath}\n`);
    } else {
      process.stdout.write(markdown);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[matriz-dry-run] BLOQUEADO: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  analyzeJson,
  assertReadOnlySql,
  buildReport,
  markdownSummary,
  normalizeForJson,
  parseArgs,
  selectSurvivor,
  survivorReason,
};
