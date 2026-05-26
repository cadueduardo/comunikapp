/**
 * Diagnóstico: lê os últimos orçamentos e seus produtos para conferir se profundidade
 * está sendo persistida no banco (Fase 11 - investigação do bug reportado pelo usuário
 * em 2026-05-26: "marquei 3d, salvei, reabri e veio como 2d").
 *
 * Uso: npx ts-node scripts/verificar-profundidade-orcamento.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orcamentos = await prisma.orcamento.findMany({
    orderBy: { criado_em: 'desc' },
    take: 5,
    select: {
      id: true,
      numero: true,
      titulo: true,
      status_aprovacao: true,
      criado_em: true,
      atualizado_em: true,
      produtos: {
        select: {
          id: true,
          nome_servico: true,
          largura: true,
          altura: true,
          profundidade: true,
          unidade_geometria: true,
          area_produto: true,
        },
      },
    },
  });

  console.log(`\n📋 Últimos ${orcamentos.length} orçamentos no banco:\n`);

  for (const orc of orcamentos) {
    console.log(
      `🔸 ${orc.numero ?? '(sem numero)'} | ${orc.titulo ?? '(sem titulo)'} | status=${orc.status_aprovacao}`,
    );
    console.log(`   criado: ${orc.criado_em.toISOString()}`);
    console.log(`   atualizado: ${orc.atualizado_em.toISOString()}`);
    if (orc.produtos.length === 0) {
      console.log('   (sem produtos)');
    } else {
      for (const p of orc.produtos) {
        console.log(
          `   - "${p.nome_servico}" | L=${p.largura} A=${p.altura} P=${p.profundidade} unidade=${p.unidade_geometria} area=${p.area_produto}`,
        );
      }
    }
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
