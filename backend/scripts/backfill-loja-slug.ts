/**
 * Backfill idempotente de loja.slug para lojas sem slug.
 * Uso (na pasta backend, com DATABASE_URL):
 *   npx ts-node -r tsconfig-paths/register scripts/backfill-loja-slug.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  isProvisionalLojaSlug,
  nextSlugOnCollision,
  suggestLojaSlugFromNome,
  isValidLojaSlug,
} from '../src/lojas/loja-slug';

const prisma = new PrismaClient();

async function slugDisponivel(slug: string, ignoreLojaId?: string) {
  const existing = await prisma.loja.findFirst({
    where: {
      slug,
      ...(ignoreLojaId ? { NOT: { id: ignoreLojaId } } : {}),
    },
    select: { id: true },
  });
  return !existing;
}

async function main() {
  const upgradeProvisional = process.argv.includes('--upgrade-provisional');
  const lojas = await prisma.loja.findMany({
    select: { id: true, nome: true, slug: true },
    orderBy: { criado_em: 'asc' },
  });

  const targets = lojas.filter((loja) => {
    if (!loja.slug) return true;
    if (upgradeProvisional && isProvisionalLojaSlug(loja.slug)) return true;
    return false;
  });

  console.log(
    `Lojas a atualizar: ${targets.length}` +
      (upgradeProvisional ? ' (inclui provisórios loja-*)' : ''),
  );

  let updated = 0;
  for (const loja of targets) {
    const base = suggestLojaSlugFromNome(loja.nome || '', loja.id);
    let attempt = 1;
    let candidate = base;

    while (attempt < 50) {
      candidate = nextSlugOnCollision(base, attempt);
      if (!isValidLojaSlug(candidate)) {
        attempt += 1;
        continue;
      }
      if (await slugDisponivel(candidate, loja.id)) break;
      attempt += 1;
    }

    if (!isValidLojaSlug(candidate) || !(await slugDisponivel(candidate, loja.id))) {
      console.error(`Falha ao gerar slug para loja ${loja.id} (${loja.nome})`);
      continue;
    }

    if (loja.slug === candidate) {
      console.log(`${loja.id} já ok: ${candidate}`);
      continue;
    }

    await prisma.loja.update({
      where: { id: loja.id },
      data: { slug: candidate },
    });
    updated += 1;
    console.log(`${loja.id} ${loja.slug ?? '(vazio)'} -> ${candidate}`);
  }

  console.log(`Atualizadas: ${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
