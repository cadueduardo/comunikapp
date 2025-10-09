/**
 * Script para debugar especificamente o cálculo do cordão
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function calcularQuantidadeInteligente(
  itemInsumo: any,
  produto: any
): { quantidade: number; unidade: string } {
  const nome = itemInsumo.insumo.nome;
  const quantidade_necessaria = parseFloat(itemInsumo.quantidade?.toString() || '0');
  const quantidadeProdutos = parseFloat(produto.quantidade || '1');
  
  console.log(`\n🔍 DEBUG CORDÃO:`);
  console.log(`  Nome: ${nome}`);
  console.log(`  Quantidade necessária: ${quantidade_necessaria}`);
  console.log(`  Quantidade produtos: ${quantidadeProdutos}`);
  
  // Lógica específica para cordão (unidades físicas de tubos)
  if (nome?.toLowerCase().includes('cordao') || nome?.toLowerCase().includes('cordão')) {
    console.log(`  ✅ Cordão detectado!`);
    
    // Extrair metros por tubo do nome do produto
    let metrosPorTubo = 205; // Default
    const match = nome.match(/(\d+)\s*m\s+branco/i) || nome.match(/(\d+)\s*m\s*$/i);
    if (match) {
      metrosPorTubo = parseInt(match[1]);
      console.log(`  📏 Metros por tubo extraídos: ${metrosPorTubo}`);
    } else {
      console.log(`  📏 Usando default: ${metrosPorTubo}m`);
    }
    
    // Calcular metros necessários (ex: 12m por banner)
    const metrosPorBanner = 12;
    const metrosTotaisNecessarios = metrosPorBanner * quantidadeProdutos;
    console.log(`  📏 Metros por banner: ${metrosPorBanner}`);
    console.log(`  📏 Metros totais necessários: ${metrosTotaisNecessarios}`);
    
    // Calcular quantos tubos são necessários
    const tubosNecessarios = Math.ceil(metrosTotaisNecessarios / metrosPorTubo);
    console.log(`  📦 Tubos necessários: ${tubosNecessarios}`);
    
    return { quantidade: tubosNecessarios, unidade: 'UNID' };
  }
  
  console.log(`  ❌ Não é cordão, retornando quantidade original: ${quantidade_necessaria}`);
  return { quantidade: quantidade_necessaria, unidade: 'un' };
}

async function debugCordao() {
  console.log('🔍 Debugando cálculo do cordão...\n');

  try {
    // Buscar OS-2025-003 especificamente (que tem cordão)
    const osComCordao = await prisma.ordemServico.findFirst({
      where: {
        numero: 'OS-2025-003'
      },
      include: {
        orcamento: {
          include: {
            produtos: {
              include: {
                insumos: {
                  include: {
                    insumo: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!osComCordao) {
      console.log('❌ Nenhuma OS encontrada');
      return;
    }

    console.log(`🔍 Analisando OS ${osComCordao.numero}...\n`);

    // Procurar por cordão
    for (const produto of osComCordao.orcamento.produtos) {
      console.log(`\n📦 Produto: ${produto.nome}`);
      console.log(`   Quantidade: ${produto.quantidade}`);
      
      for (const itemInsumo of produto.insumos) {
        if (itemInsumo.insumo.nome.toLowerCase().includes('cordao')) {
          console.log(`\n🎯 CORDÃO ENCONTRADO:`);
          console.log(`   Item: ${itemInsumo.insumo.nome}`);
          console.log(`   Quantidade no banco: ${itemInsumo.quantidade}`);
          console.log(`   Unidade no banco: ${itemInsumo.unidade}`);
          
          const resultado = calcularQuantidadeInteligente(itemInsumo, produto);
          console.log(`\n📊 RESULTADO FINAL:`);
          console.log(`   Quantidade calculada: ${resultado.quantidade}`);
          console.log(`   Unidade: ${resultado.unidade}`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Erro ao debugar cordão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar debug
if (require.main === module) {
  debugCordao()
    .then(() => {
      console.log('\n🏁 Debug finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { debugCordao };
