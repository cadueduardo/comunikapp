/**
 * Script para verificar quantidade de produtos nas OSs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarProdutosOS() {
  console.log('🔍 Verificando quantidade de produtos nas OSs...\n');

  try {
    const ordensServico = await prisma.ordemServico.findMany({
      where: {
        orcamento_id: {
          not: null
        }
      },
      include: {
        orcamento: {
          include: {
            produtos: true
          }
        }
      }
    });

    console.log(`📊 Encontradas ${ordensServico.length} OSs\n`);

    for (const os of ordensServico) {
      console.log(`🔍 OS ${os.numero}:`);
      console.log(`   ID: ${os.id}`);
      console.log(`   Orçamento ID: ${os.orcamento_id}`);
      
      if (os.orcamento && os.orcamento.produtos) {
        console.log(`   Produtos no Orçamento: ${os.orcamento.produtos.length}`);
        
        let totalProdutos = 0;
        os.orcamento.produtos.forEach((produto, index) => {
          const quantidade = parseFloat(produto.quantidade?.toString() || '1');
          totalProdutos += quantidade;
          console.log(`     ${index + 1}. ${produto.nome}: ${quantidade} unidades`);
        });
        
        console.log(`   📊 TOTAL DE PRODUTOS: ${totalProdutos}`);
        
        // Calcular ilhós esperados
        const ilhosEsperados = totalProdutos * 4; // 4 ilhós por banner
        console.log(`   🔢 ILHÓS ESPERADOS (${totalProdutos} × 4): ${ilhosEsperados} UNID`);
      }
      console.log('\n');
    }
  } catch (error) {
    console.error('Erro ao verificar produtos das OSs:', error);
  } finally {
    await prisma.$disconnect();
  }
  console.log('🏁 Verificação finalizada.');
}

verificarProdutosOS();
