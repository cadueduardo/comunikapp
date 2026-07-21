#!/usr/bin/env node

/**
 * Inventário e correção explícita de Insumo.categoriaId apontando para
 * categoria de outra loja (dívida pré-matriz).
 *
 * Padrão: dry-run (somente leitura).
 * Apply: remapeia somente quando existe exatamente uma categoria com o
 * mesmo nome na loja do insumo. Casos ambíguos ou sem match abortam o apply.
 *
 * Uso:
 *   node backend/scripts/fix-insumo-categoria-cross-loja.js
 *   node backend/scripts/fix-insumo-categoria-cross-loja.js --apply --confirmation=CORRIGIR_CATEGORIA_CROSS_LOJA
 */

const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');

const CONFIRMATION = 'CORRIGIR_CATEGORIA_CROSS_LOJA';

function parseArgs(argv) {
  const options = {
    apply: false,
    confirmation: null,
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
    if (arg.startsWith('--output-dir=')) {
      options.outputDir = path.resolve(arg.slice('--output-dir='.length));
      continue;
    }
  }

  return options;
}

async function inventariar(prisma) {
  const rows = await prisma.$queryRaw`
    SELECT
      i.id AS insumo_id,
      i.nome AS insumo_nome,
      i.loja_id AS insumo_loja_id,
      li.nome AS insumo_loja_nome,
      i.categoriaId AS categoria_errada_id,
      c.nome AS categoria_errada_nome,
      c.loja_id AS categoria_errada_loja_id,
      lc.nome AS categoria_errada_loja_nome
    FROM insumos i
    INNER JOIN categorias c ON c.id = i.categoriaId
    INNER JOIN loja li ON li.id = i.loja_id
    INNER JOIN loja lc ON lc.id = c.loja_id
    WHERE i.loja_id <> c.loja_id
    ORDER BY i.loja_id, i.nome
  `;

  const propostas = [];
  for (const row of rows) {
    const matches = await prisma.categoria.findMany({
      where: {
        loja_id: row.insumo_loja_id,
        nome: row.categoria_errada_nome,
      },
      select: { id: true, nome: true },
      orderBy: { id: 'asc' },
    });

    let status = 'needs_manual';
    let categoria_destino_id = null;
    if (matches.length === 1) {
      status = 'auto_remap_by_name';
      categoria_destino_id = matches[0].id;
    } else if (matches.length > 1) {
      status = 'ambiguous_name_match';
    }

    propostas.push({
      ...row,
      status,
      categoria_destino_id,
      matches_mesmo_nome: matches,
    });
  }

  return propostas;
}

async function aplicar(prisma, propostas) {
  const auto = propostas.filter((p) => p.status === 'auto_remap_by_name');
  const bloqueados = propostas.filter((p) => p.status !== 'auto_remap_by_name');

  if (bloqueados.length > 0) {
    const err = new Error(
      `Apply abortado: ${bloqueados.length} item(ns) exigem decisão manual (sem match único por nome).`,
    );
    err.code = 'NEEDS_MANUAL';
    err.bloqueados = bloqueados;
    throw err;
  }

  const applied = [];
  await prisma.$transaction(async (tx) => {
    for (const item of auto) {
      const result = await tx.insumo.updateMany({
        where: {
          id: item.insumo_id,
          loja_id: item.insumo_loja_id,
          categoriaId: item.categoria_errada_id,
        },
        data: { categoriaId: item.categoria_destino_id },
      });
      if (result.count !== 1) {
        throw new Error(
          `Falha ao atualizar insumo ${item.insumo_id}: count=${result.count}`,
        );
      }
      applied.push({
        insumo_id: item.insumo_id,
        de: item.categoria_errada_id,
        para: item.categoria_destino_id,
      });
    }
  });

  return applied;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  try {
    if (options.apply) {
      if (options.confirmation !== CONFIRMATION) {
        console.error(
          `Apply exige --confirmation=${CONFIRMATION}. Nada foi alterado.`,
        );
        process.exitCode = 2;
        return;
      }
    }

    const propostas = await inventariar(prisma);
    const resumo = {
      modo: options.apply ? 'apply' : 'dry-run',
      total: propostas.length,
      auto_remap_by_name: propostas.filter(
        (p) => p.status === 'auto_remap_by_name',
      ).length,
      needs_manual: propostas.filter((p) => p.status === 'needs_manual')
        .length,
      ambiguous_name_match: propostas.filter(
        (p) => p.status === 'ambiguous_name_match',
      ).length,
      propostas,
      applied: [],
    };

    if (options.apply) {
      if (propostas.length === 0) {
        console.log(
          JSON.stringify(
            { ...resumo, message: 'Nenhum vínculo cross-loja encontrado.' },
            null,
            2,
          ),
        );
        return;
      }
      resumo.applied = await aplicar(prisma, propostas);
    }

    if (options.writeReports) {
      fs.mkdirSync(options.outputDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = path.join(
        options.outputDir,
        `categoria-cross-loja-${resumo.modo}-${stamp}.json`,
      );
      fs.writeFileSync(file, JSON.stringify(resumo, null, 2), 'utf8');
      resumo.report_file = path.basename(file);
    }

    console.log(JSON.stringify(resumo, null, 2));

    if (options.apply === false && propostas.length > 0) {
      process.exitCode = 0;
    }
  } catch (err) {
    console.error(
      JSON.stringify(
        {
          error: err.message,
          code: err.code || 'ERROR',
          bloqueados: err.bloqueados || undefined,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  CONFIRMATION,
  parseArgs,
  inventariar,
  aplicar,
};
