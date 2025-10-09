/**
 * Script para forçar atualização dos dados no frontend
 * Este script adiciona um timestamp para forçar o refetch dos dados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forcarAtualizacaoFrontend() {
  console.log('🔄 Forçando atualização dos dados no frontend...\n');

  try {
    // Buscar todas as OSs que têm orçamento
    const ordensServico = await prisma.ordemServico.findMany({
      where: {
        orcamento_id: {
          not: null
        }
      },
      select: {
        id: true,
        numero: true,
        insumos_calculados: true,
        atualizado_em: true
      }
    });

    console.log(`📊 Encontradas ${ordensServico.length} OSs para atualizar\n`);

    let sucessos = 0;
    let erros = 0;

    for (const os of ordensServico) {
      try {
        // Atualizar o campo atualizado_em para forçar refetch
        await prisma.ordemServico.update({
          where: { id: os.id },
          data: {
            atualizado_em: new Date()
          }
        });

        console.log(`✅ OS ${os.numero} atualizada com timestamp ${new Date().toISOString()}`);
        sucessos++;
      } catch (error) {
        console.error(`❌ Erro ao atualizar OS ${os.numero}:`, error);
        erros++;
      }
    }

    console.log(`\n📈 RESUMO DA ATUALIZAÇÃO:`);
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📊 Total processado: ${sucessos + erros}\n`);

    console.log('🎉 Atualização forçada concluída!');
    console.log('💡 Dica: Faça um hard refresh (Ctrl+F5) no frontend para ver as mudanças.\n');

  } catch (error) {
    console.error('Erro geral ao forçar atualização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar atualização
if (require.main === module) {
  forcarAtualizacaoFrontend()
    .then(() => {
      console.log('🏁 Script finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { forcarAtualizacaoFrontend };





