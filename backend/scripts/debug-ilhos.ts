/**
 * Script para debugar cálculo de ilhós
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function calcularQuantidadeInteligenteDebug(
  insumoCalculado: any,
  produto: any
): { quantidade: number; unidade: string; display: string; [key: string]: any } {
  const nome = insumoCalculado.nome;
  const quantidade_necessaria_original = parseFloat(insumoCalculado.quantidade_necessaria?.toString() || '0');
  const unidade_original = insumoCalculado.unidade;
  const quantidadeProdutos = parseFloat(produto.quantidade || '1');

  console.log(`\n🔍 DEBUG ILHÓS:`);
  console.log(`  Nome do Insumo: ${nome}`);
  console.log(`  Quantidade de Produtos na OS: ${quantidadeProdutos}`);
  console.log(`  Quantidade Necessária Original (do orçamento): ${quantidade_necessaria_original} ${unidade_original}`);

  // Lógica específica para ilhos (unidades)
  if (nome?.toLowerCase().includes('ilho')) {
    console.log(`  ✅ Ilhós detectado!`);
    const ilhosPorBanner = 4; // Assumindo 4 ilhós por banner
    console.log(`  ⚙️ Ilhós por banner (regra): ${ilhosPorBanner}`);

    const unidadesNecessarias = ilhosPorBanner * quantidadeProdutos;
    console.log(`  📊 Unidades Necessárias Calculadas: ${unidadesNecessarias}`);

    return {
      quantidade: unidadesNecessarias,
      unidade: 'UNID',
      display: `${unidadesNecessarias} UNID`,
      ilhos_por_banner: ilhosPorBanner,
      quantidade_produtos: quantidadeProdutos
    };
  }

  // Fallback para outros materiais
  return { quantidade: quantidade_necessaria_original, unidade: unidade_original, display: `${quantidade_necessaria_original} ${unidade_original}` };
}

async function debugIlhos() {
  console.log('🔍 Debugando cálculo de ilhós...\n');

  try {
    // Tentar encontrar uma OS que contenha "Ilhos"
    const osComIlhos = await prisma.ordemServico.findFirst({
      where: {
        insumos_calculados: {
          contains: 'ilho' // Busca por "ilho" no JSON stringificado
        }
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

    if (!osComIlhos) {
      console.log('❌ Nenhuma OS com ilhós encontrada para depuração.');
      return;
    }

    console.log(`\n🔍 Analisando OS ${osComIlhos.numero} (ID: ${osComIlhos.id})...\n`);

    const insumosCalculadosOS = JSON.parse(osComIlhos.insumos_calculados || '[]');

    for (const produto of osComIlhos.orcamento.produtos) {
      console.log(`\n📦 Produto: ${produto.nome} (ID: ${produto.id})`);
      console.log(`   Quantidade do Produto: ${produto.quantidade}`);

      for (const itemInsumo of produto.insumos) {
        if (itemInsumo.insumo.nome?.toLowerCase().includes('ilho')) {
          console.log(`\n🎯 ILHÓS ENCONTRADO NO ORÇAMENTO:`);
          console.log(`   Nome do Insumo: ${itemInsumo.insumo.nome}`);
          console.log(`   Quantidade no Orçamento: ${itemInsumo.quantidade}`);
          console.log(`   Unidade no Orçamento: ${itemInsumo.unidade}`);

          // Encontrar o insumo calculado correspondente na OS
          const insumoCalculadoNaOS = insumosCalculadosOS.find(
            (ic: any) => ic.insumo_id === itemInsumo.insumo.id && ic.produto_nome === produto.nome
          );

          if (insumoCalculadoNaOS) {
            console.log(`\n📊 INSUMO CALCULADO NA OS:`);
            console.log(`   Nome: ${insumoCalculadoNaOS.nome}`);
            console.log(`   Quantidade Necessária: ${insumoCalculadoNaOS.quantidade_necessaria}`);
            console.log(`   Unidade: ${insumoCalculadoNaOS.unidade}`);
            console.log(`   Display: ${insumoCalculadoNaOS.display}`);

            // Simular o cálculo inteligente com os dados da OS
            const resultadoDebug = calcularQuantidadeInteligenteDebug(insumoCalculadoNaOS, produto);
            console.log(`\n🧪 RESULTADO DO CÁLCULO INTELIGENTE (DEBUG):`);
            console.log(`   Quantidade Calculada: ${resultadoDebug.quantidade}`);
            console.log(`   Unidade: ${resultadoDebug.unidade}`);
            console.log(`   Display: ${resultadoDebug.display}`);
          } else {
            console.log(`   Insumo de ilhós não encontrado em insumos_calculados da OS.`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao depurar cálculo de ilhós:', error);
  } finally {
    await prisma.$disconnect();
  }
  console.log('\n🏁 Debug de ilhós finalizado.');
}

debugIlhos();





