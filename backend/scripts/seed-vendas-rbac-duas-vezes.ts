/**
 * Demonstra seed M2.1 duas vezes no MySQL real + relatório sanitizado.
 * Uso: npx ts-node scripts/seed-vendas-rbac-duas-vezes.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  SeedVendasColisaoError,
  seedVendasPerfisEPermissoes,
} from '../prisma/seed-vendas-rbac';

const prisma = new PrismaClient();

function sanitizar(relatorio: unknown) {
  const json = JSON.stringify(relatorio);
  if (/@|senha|password|token/i.test(json)) {
    throw new Error('Relatório contém campo sensível inesperado');
  }
  return relatorio;
}

async function main() {
  const r1 = await seedVendasPerfisEPermissoes(prisma);
  const r2 = await seedVendasPerfisEPermissoes(prisma);

  const resumo = {
    gerado_em: new Date().toISOString(),
    primeira: sanitizar({
      lojas: r1.lojas_processadas,
      perfis_criados: r1.perfis_criados,
      perfis_atualizados: r1.perfis_atualizados,
      permissoes_upsert: r1.permissoes_upsert,
      vinculos_criados: r1.vinculos_criados,
      pulados: r1.vinculos_pulados_ja_tinham_perfil,
      sem_associacao: r1.usuarios_sem_associacao.length,
    }),
    segunda: sanitizar({
      lojas: r2.lojas_processadas,
      perfis_criados: r2.perfis_criados,
      perfis_atualizados: r2.perfis_atualizados,
      permissoes_upsert: r2.permissoes_upsert,
      vinculos_criados: r2.vinculos_criados,
      pulados: r2.vinculos_pulados_ja_tinham_perfil,
      sem_associacao: r2.usuarios_sem_associacao.length,
    }),
    idempotente:
      r2.perfis_criados === 0 &&
      r2.vinculos_criados === 0 &&
      r2.lojas_processadas === r1.lojas_processadas,
  };

  console.log(JSON.stringify(resumo, null, 2));
  if (!resumo.idempotente) {
    process.exitCode = 2;
  }
}

main()
  .catch((e) => {
    if (e instanceof SeedVendasColisaoError) {
      console.error(
        JSON.stringify({ abortado: true, colisoes: e.relatorio.colisoes }),
      );
    } else {
      console.error(JSON.stringify({ erro: String(e?.message ?? e) }));
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
