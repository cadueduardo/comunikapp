/**
 * Script para verificar dimensões dos produtos nas OSs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarDimensoesProdutos() {
  console.log('🔍 Verificando dimensões dos produtos...\n');

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
      
      if (os.orcamento && os.orcamento.produtos) {
        os.orcamento.produtos.forEach((produto, index) => {
          console.log(`\n${index + 1}. ${produto.nome}:`);
          console.log(`   Largura: ${produto.largura} ${produto.unidade_medida || 'cm'}`);
          console.log(`   Altura: ${produto.altura} ${produto.unidade_medida || 'cm'}`);
          console.log(`   Quantidade: ${produto.quantidade}`);
          
          // Calcular perímetro se tiver dimensões
          if (produto.largura && produto.altura) {
            const largura = parseFloat(produto.largura.toString());
            const altura = parseFloat(produto.altura.toString());
            const perimetro = 2 * (largura + altura);
            const espacamento = 15;
            const quantidadeUnitaria = Math.ceil(perimetro / espacamento);
            const quantidadeProdutos = parseFloat(produto.quantidade?.toString() || '1');
            const ilhosNecessarios = quantidadeUnitaria * quantidadeProdutos;
            
            console.log(`   📐 Perímetro: ${perimetro} cm`);
            console.log(`   📏 Espaçamento: ${espacamento} cm`);
            console.log(`   🔢 Ilhós por produto: ${quantidadeUnitaria}`);
            console.log(`   🎯 ILHÓS TOTAL: ${ilhosNecessarios} UNID`);
          } else {
            console.log(`   ❌ Sem dimensões - usando fallback (4 ilhós por produto)`);
          }
        });
      }
      console.log('\n');
    }
  } catch (error) {
    console.error('Erro ao verificar dimensões dos produtos:', error);
  } finally {
    await prisma.$disconnect();
  }
  console.log('🏁 Verificação finalizada.');
}

verificarDimensoesProdutos();
