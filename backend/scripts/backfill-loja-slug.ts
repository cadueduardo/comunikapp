/**
 * Backfill idempotente de loja.slug para lojas sem slug.
 * Uso (na pasta backend, com DATABASE_URL):
 *   npx ts-node -r tsconfig-paths/register scripts/backfill-loja-slug.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  isValidLojaSlug,
  nextSlugOnCollision,
  suggestLojaSlugFromNome,
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
  const lojas = await prisma.loja.findMany({
    where: { OR: [{ slug: null }, { slug: '' }] },
    select: { id: true, nome: true, slug: true },
    orderBy: { criado_em: 'asc' },
  });

  console.log(`Lojas sem slug: ${lojas.length}`);

  let updated = 0;
  for (const loja of lojas) {
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

    await prisma.loja.update({
      where: { id: loja.id },
      data: { slug: candidate },
    });
    updated += 1;
    console.log(`${loja.id} -> ${candidate}`);
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
