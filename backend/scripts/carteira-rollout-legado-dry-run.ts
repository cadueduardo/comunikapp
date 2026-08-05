/**
 * Contagem sanitizada de clientes sem responsável comercial (pré-M4.1 / legado).
 *
 * - Dry-run por padrão (não grava).
 * - Relatório só com contagens e IDs de loja/cliente pseudonimizados.
 * - Nunca atribui automaticamente (proibido “tudo para o primeiro admin”).
 *
 * Uso:
 *   npx ts-node -r tsconfig-paths/register scripts/carteira-rollout-legado-dry-run.ts
 *
 * Requer DATABASE_URL apontando para banco local/teste (não produção).
 */
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function pseudo(valor: string): string {
  return createHash('sha256').update(valor).digest('hex').slice(0, 12);
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Proibido em NODE_ENV=production.');
  }

  const databaseUrl = process.env.DATABASE_URL ?? '';
  const nomeBanco = (() => {
    try {
      return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ''));
    } catch {
      return '';
    }
  })();

  if (!nomeBanco || !/(test|teste|scratch|ci|local|dev)/i.test(nomeBanco)) {
    throw new Error(
      `Banco "${nomeBanco || '(vazio)'}" recusado. Use test/scratch/ci/local/dev.`,
    );
  }

  console.log('=== Dry-run: clientes sem responsável comercial ===');
  console.log(`banco=${nomeBanco}`);
  console.log('modo=somente_leitura');

  const porLoja = await prisma.cliente.groupBy({
    by: ['loja_id'],
    where: { responsavel_comercial_id: null },
    _count: { _all: true },
  });

  const total = porLoja.reduce((acc, row) => acc + row._count._all, 0);
  console.log(`total_sem_responsavel=${total}`);
  console.log('por_loja:');

  for (const row of porLoja) {
    const amostra = await prisma.cliente.findMany({
      where: { loja_id: row.loja_id, responsavel_comercial_id: null },
      select: { id: true },
      take: 5,
      orderBy: { criado_em: 'asc' },
    });
    console.log(
      JSON.stringify({
        loja_ref: pseudo(row.loja_id),
        quantidade: row._count._all,
        amostra_cliente_refs: amostra.map((c) => pseudo(c.id)),
      }),
    );
  }

  console.log(
    'acao_recomendada=atribuicao_manual_ou_importacao_controlada (ver docs/modulo-vendas/fase-4/rollout-clientes-legados.md)',
  );
}

main()
  .catch((erro) => {
    console.error(erro instanceof Error ? erro.message : 'Falha no dry-run.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
