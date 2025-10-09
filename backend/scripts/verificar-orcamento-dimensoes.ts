/**
 * Script para verificar dimensões no orçamento original
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarOrcamentoDimensoes() {
  console.log('🔍 Verificando dimensões no orçamento original...\n');

  try {
    // Buscar o orçamento da OS-2025-003
    const os = await prisma.ordemServico.findFirst({
      where: {
        numero: 'OS-2025-003'
      },
      include: {
        orcamento: {
          include: {
            produtos: true
          }
        }
      }
    });

    if (!os) {
      console.log('❌ OS-2025-003 não encontrada');
      return;
    }

    console.log(`🔍 Orçamento ${os.orcamento?.numero || 'N/A'} (ID: ${os.orcamento_id}):`);
    
    if (os.orcamento && os.orcamento.produtos) {
      os.orcamento.produtos.forEach((produto, index) => {
        console.log(`\n${index + 1}. ${produto.nome}:`);
        console.log(`   Largura: ${produto.largura}`);
        console.log(`   Altura: ${produto.altura}`);
        console.log(`   Quantidade: ${produto.quantidade}`);
        console.log(`   Unidade Medida: ${produto.unidade_medida}`);
        console.log(`   Área: ${produto.area_produto}`);
        
        // Verificar se tem dimensões válidas
        if (produto.largura && produto.altura) {
          const largura = parseFloat(produto.largura.toString());
          const altura = parseFloat(produto.altura.toString());
          const perimetro = 2 * (largura + altura);
          const espacamento = 15;
          const quantidadeUnitaria = Math.ceil(perimetro / espacamento);
          const quantidadeProdutos = parseFloat(produto.quantidade?.toString() || '1');
          const ilhosNecessarios = quantidadeUnitaria * quantidadeProdutos;
          
          console.log(`   ✅ COM DIMENSÕES:`);
          console.log(`   📐 Perímetro: ${perimetro} cm`);
          console.log(`   🔢 Ilhós por produto: ${quantidadeUnitaria}`);
          console.log(`   🎯 ILHÓS TOTAL: ${ilhosNecessarios} UNID`);
        } else {
          console.log(`   ❌ SEM DIMENSÕES`);
        }
      });
    }

  } catch (error) {
    console.error('Erro ao verificar orçamento:', error);
  } finally {
    await prisma.$disconnect();
  }
  console.log('\n🏁 Verificação finalizada.');
}

verificarOrcamentoDimensoes();





