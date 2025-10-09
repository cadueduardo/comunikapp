/**
 * Script para verificar os materiais das OSs após aplicação da lógica inteligente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarMateriaisOS() {
  console.log('🔍 Verificando materiais das OSs...\n');

  try {
    const osComMateriais = await prisma.ordemServico.findMany({
      where: {
        orcamento_id: {
          not: null
        }
      },
      select: {
        id: true,
        numero: true,
        insumos_calculados: true
      }
    });

    console.log(`📊 Encontradas ${osComMateriais.length} OSs\n`);

    for (const os of osComMateriais) {
      console.log(`\n🔍 OS ${os.numero}:`);
      
      if (os.insumos_calculados) {
        try {
          const materiais = JSON.parse(os.insumos_calculados);
          console.log(`  📦 ${materiais.length} materiais encontrados:`);
          
          materiais.forEach((material: any, index: number) => {
            console.log(`    ${index + 1}. ${material.nome}`);
            console.log(`       Quantidade: ${material.quantidade_necessaria} ${material.unidade}`);
            console.log(`       Lógica: ${material.logica_consumo || 'N/A'}`);
          });
        } catch (error) {
          console.log(`  ❌ Erro ao parsear JSON: ${error.message}`);
        }
      } else {
        console.log('  ⚠️  Sem materiais calculados');
      }
    }

  } catch (error) {
    console.error('💥 Erro ao verificar OSs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
if (require.main === module) {
  verificarMateriaisOS()
    .then(() => {
      console.log('\n🏁 Verificação finalizada.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { verificarMateriaisOS };





