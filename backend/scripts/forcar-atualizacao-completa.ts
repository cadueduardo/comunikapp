/**
 * Script para forçar atualização completa dos dados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forcarAtualizacaoCompleta() {
  console.log('🔄 Forçando atualização completa dos dados...\n');

  try {
    // 1. Atualizar timestamp de todas as OSs
    console.log('1️⃣ Atualizando timestamps das OSs...');
    const ordensServico = await prisma.ordemServico.findMany({
      where: {
        orcamento_id: {
          not: null
        }
      }
    });

    let sucessos = 0;
    for (const os of ordensServico) {
      await prisma.ordemServico.update({
        where: { id: os.id },
        data: {
          atualizado_em: new Date()
        }
      });
      console.log(`✅ OS ${os.numero} atualizada`);
      sucessos++;
    }

    console.log(`\n📊 ${sucessos} OSs atualizadas com novos timestamps\n`);

    // 2. Verificar se há problemas de cache no frontend
    console.log('2️⃣ Verificando dados finais...');
    const osTeste = await prisma.ordemServico.findFirst({
      where: {
        numero: 'OS-2025-003'
      },
      select: {
        numero: true,
        insumos_calculados: true,
        atualizado_em: true
      }
    });

    if (osTeste) {
      console.log(`\n🔍 OS ${osTeste.numero}:`);
      console.log(`   Atualizado em: ${osTeste.atualizado_em}`);
      
      if (osTeste.insumos_calculados) {
        const insumos = JSON.parse(osTeste.insumos_calculados);
        console.log(`   Insumos: ${insumos.length} itens`);
        
        insumos.forEach((insumo: any) => {
          if (insumo.nome?.includes('Bobina')) {
            console.log(`   📦 ${insumo.nome}:`);
            console.log(`      Display: ${insumo.display}`);
          }
          if (insumo.nome?.includes('Ilho')) {
            console.log(`   🔗 ${insumo.nome}:`);
            console.log(`      Display: ${insumo.display}`);
          }
        });
      }
    }

    console.log('\n🎉 Atualização completa finalizada!');
    console.log('\n💡 INSTRUÇÕES PARA O FRONTEND:');
    console.log('1. Feche completamente o navegador');
    console.log('2. Abra o navegador novamente');
    console.log('3. Acesse a OS');
    console.log('4. Se ainda não funcionar, pressione Ctrl+Shift+R (hard refresh)');
    console.log('5. Ou abra DevTools (F12) → Network → "Disable cache" → F5');

  } catch (error) {
    console.error('Erro ao forçar atualização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar atualização
if (require.main === module) {
  forcarAtualizacaoCompleta()
    .then(() => {
      console.log('\n🏁 Script finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { forcarAtualizacaoCompleta };





