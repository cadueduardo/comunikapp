import { PrismaService } from '../../prisma/prisma.service';

/**
 * Utilitários de SQL para o módulo de estoque
 * Nota: Aceita PrismaService por parâmetro para manter util stateless
 */

export async function detectTableName(
  prisma: PrismaService,
  candidates: string[],
): Promise<string | null> {
  if (!candidates?.length) return null;
  const placeholders = candidates.map(() => '?').join(', ');
  const sql = `SELECT table_name FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name IN (${placeholders})`;
  const rows: Array<{ table_name: string }> = await prisma.$queryRawUnsafe(
    sql,
    ...candidates,
  );
  if (!rows?.length) return null;
  // prioriza a ordem informada em candidates
  const byName = new Map(rows.map((r) => [r.table_name, true] as const));
  for (const name of candidates) {
    if (byName.has(name)) return name;
  }
  return rows[0].table_name;
}

export async function getExistingColumns(
  prisma: PrismaService,
  tableName: string,
): Promise<Set<string>> {
  const result: Array<{ COLUMN_NAME: string }> = await prisma.$queryRawUnsafe(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ',
    tableName,
  );
  return new Set(result.map((r) => r.COLUMN_NAME));
}
