#!/usr/bin/env ts-node

/**
 * Script para debugar os cálculos de materiais de uma OS específica
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugOSMateriais() {
  console.log('🔍 Debugando cálculos de materiais da OS...\n');

  try {
    // Buscar a OS que mostra "27 M2 - 1 UNID - BOBINA"
    const os = await prisma.ordemServico.findFirst({
      where: {
        insumos_calculados: {
          contains: '27 M2'
        }
      },
      include: {
        orcamento: {
          include: {
            produtos: {
              include: {
                insumos: {
                  include: {
                    insumo: {
                      include: {
                        categoria: true,
                        tipoMaterial: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!os) {
      console.log('❌ OS não encontrada');
      return;
    }

    console.log(`📋 OS Encontrada: ${os.numero} (ID: ${os.id})`);
    console.log(`📦 Quantidade da OS: ${os.quantidade}`);
    console.log(`🔗 Orçamento ID: ${os.orcamento_id}\n`);

    // Mostrar dados do orçamento
    if (os.orcamento) {
      console.log('📊 DADOS DO ORÇAMENTO:');
      console.log('=====================');
      
      os.orcamento.produtos.forEach((produto, index) => {
        console.log(`\n🏷️  Produto ${index + 1}: ${produto.nome}`);
        console.log(`   Quantidade: ${produto.quantidade}`);
        console.log(`   Largura: ${(produto as any).largura_produto || 'N/A'}`);
        console.log(`   Altura: ${(produto as any).altura_produto || 'N/A'}`);
        console.log(`   Área: ${produto.area_produto} m²`);
        
        console.log(`   📦 Materiais:`);
        produto.insumos.forEach((itemInsumo, idx) => {
          console.log(`      ${idx + 1}. ${itemInsumo.insumo.nome}`);
          console.log(`         Quantidade no orçamento: ${itemInsumo.quantidade}`);
          console.log(`         Unidade: ${itemInsumo.unidade || itemInsumo.insumo.unidade_uso}`);
          console.log(`         Lógica consumo: ${itemInsumo.insumo.logica_consumo}`);
          console.log(`         Custo unitário: ${(itemInsumo as any).custo_unitario || 'N/A'}`);
          console.log(`         Custo total: ${(itemInsumo as any).custo_total || 'N/A'}`);
        });
      });
    }

    // Mostrar materiais calculados na OS
    console.log('\n🧮 MATERIAIS CALCULADOS NA OS:');
    console.log('===============================');
    
    if (os.insumos_calculados) {
      let materiaisCalculados;
      try {
        materiaisCalculados = typeof os.insumos_calculados === 'string' 
          ? JSON.parse(os.insumos_calculados) 
          : os.insumos_calculados;
      } catch (error) {
        console.log('❌ Erro ao parsear insumos_calculados:', error.message);
        return;
      }

      materiaisCalculados.forEach((material: any, index: number) => {
        console.log(`\n${index + 1}. ${material.nome}`);
        console.log(`   Quantidade necessária: ${material.quantidade_necessaria}`);
        console.log(`   Unidade: ${material.unidade}`);
        console.log(`   Display: ${material.display}`);
        console.log(`   Produto origem: ${material.produto_nome}`);
        console.log(`   Lógica consumo: ${material.logica_consumo}`);
      });
    }

    // Calcular manualmente para verificar
    console.log('\n🧮 CÁLCULO MANUAL:');
    console.log('==================');
    
    if (os.orcamento && os.orcamento.produtos.length > 0) {
      const produto = os.orcamento.produtos[0];
      const quantidadeProdutos = parseFloat(String(produto.quantidade || '1'));
      
      console.log(`Quantidade de produtos: ${quantidadeProdutos}`);
      
      produto.insumos.forEach((itemInsumo, idx) => {
        if (itemInsumo.insumo.nome.includes('Bobina')) {
          console.log(`\n🔍 Analisando: ${itemInsumo.insumo.nome}`);
          console.log(`   Quantidade base (do orçamento): ${itemInsumo.quantidade}`);
          console.log(`   Unidade: ${itemInsumo.unidade || itemInsumo.insumo.unidade_uso}`);
          console.log(`   Lógica consumo: ${itemInsumo.insumo.logica_consumo}`);
          
          // Verificar se precisa multiplicar
          const unidade_uso = itemInsumo.insumo.unidade_uso?.toLowerCase() || '';
          const logica_consumo = itemInsumo.insumo.logica_consumo || 'area';
          const precisaMultiplicar = 
            (unidade_uso.includes('un') || unidade_uso.includes('unidade')) &&
            !unidade_uso.includes('m2') && 
            !unidade_uso.includes('m²') &&
            logica_consumo !== 'area';
          
          console.log(`   Precisa multiplicar? ${precisaMultiplicar}`);
          
          const quantidade_base = parseFloat(String(itemInsumo.quantidade || '0'));
          const quantidade_necessaria = precisaMultiplicar 
            ? quantidade_base * quantidadeProdutos 
            : quantidade_base;
          
          console.log(`   Quantidade necessária: ${quantidade_necessaria} m²`);
          
          // Calcular bobinas
          let areaPorBobina = 70; // Default
          const match = itemInsumo.insumo.nome.match(/(\d+[,.]?\d*)\s*[x×]\s*(\d+[,.]?\d*)\s*m/i);
          if (match) {
            const largura = parseFloat(match[1].replace(',', '.'));
            const altura = parseFloat(match[2].replace(',', '.'));
            areaPorBobina = largura * altura;
            console.log(`   Dimensões da bobina: ${largura}m x ${altura}m = ${areaPorBobina} m²`);
          }
          
          const bobinasNecessarias = Math.ceil(quantidade_necessaria / areaPorBobina);
          console.log(`   Bobinas necessárias: Math.ceil(${quantidade_necessaria} / ${areaPorBobina}) = ${bobinasNecessarias}`);
          console.log(`   Display final: ${quantidade_necessaria} M2 - ${bobinasNecessarias} UNID - BOBINA`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro na execução:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
if (require.main === module) {
  debugOSMateriais()
    .then(() => {
      console.log('\n✅ Debug concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { debugOSMateriais };
