/**
 * Script para testar o endpoint da API diretamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testarAPIEndpoint() {
  console.log('🔍 Testando endpoint da API diretamente...\n');

  try {
    // Buscar uma OS específica
    const os = await prisma.ordemServico.findFirst({
      where: {
        orcamento_id: {
          not: null
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
      console.log('❌ Nenhuma OS encontrada');
      return;
    }

    console.log(`🔍 Testando OS ${os.numero}...\n`);

    // Simular exatamente o que a API retorna
    const insumosCalculados = JSON.parse(os.insumos_calculados || '[]');
    
    console.log('📊 Dados que a API deveria retornar:');
    console.log(`   OS ID: ${os.id}`);
    console.log(`   OS Número: ${os.numero}`);
    console.log(`   Insumos Calculados: ${insumosCalculados.length} itens`);
    
    insumosCalculados.forEach((insumo: any, index: number) => {
      console.log(`\n   ${index + 1}. ${insumo.nome}:`);
      console.log(`      Quantidade: ${insumo.quantidade_necessaria} ${insumo.unidade}`);
      console.log(`      Display: ${insumo.display}`);
      console.log(`      Disponível: ${insumo.disponivel_estoque ? 'Sim' : 'Não'}`);
      console.log(`      Origem: ${insumo.origem}`);
    });

    // Simular o que o formatarOrdemServico faria
    const produtosFormatados = os.orcamento?.produtos?.map(produto => {
      const materiais = produto.insumos?.map(itemInsumo => {
        const insumoCalculado = insumosCalculados.find((ic: any) => 
          ic.insumo_id === itemInsumo.insumo.id && ic.produto_nome === produto.nome
        );

        let quantidadeFinal = itemInsumo.quantidade;
        let unidadeFinal = itemInsumo.unidade;
        let displayFinal = `${quantidadeFinal} ${unidadeFinal}`;

        if (insumoCalculado) {
          quantidadeFinal = insumoCalculado.quantidade_necessaria;
          unidadeFinal = insumoCalculado.unidade;
          displayFinal = insumoCalculado.display || `${quantidadeFinal} ${unidadeFinal}`;
        }

        return {
          id: itemInsumo.insumo.id,
          nome: itemInsumo.insumo.nome,
          quantidade: quantidadeFinal,
          unidade: unidadeFinal,
          display: displayFinal,
          categoria: 'Sem categoria',
          disponivel_estoque: insumoCalculado?.disponivel_estoque ?? true,
          quantidade_disponivel: insumoCalculado?.quantidade_disponivel,
          localizacao_estoque: insumoCalculado?.localizacao_estoque
        };
      }) || [];

      return {
        id: produto.id,
        nome: produto.nome,
        materiais: materiais
      };
    }) || [];

    console.log('\n📊 Produtos formatados (como a API retorna):');
    produtosFormatados.forEach((produto, index) => {
      console.log(`\n${index + 1}. ${produto.nome}:`);
      produto.materiais.forEach((material, matIndex) => {
        console.log(`   ${matIndex + 1}. ${material.nome}`);
        console.log(`      Display: ${material.display}`);
        console.log(`      Disponível: ${material.disponivel_estoque ? 'Sim' : 'Não'}`);
      });
    });

  } catch (error) {
    console.error('💥 Erro ao testar API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
if (require.main === module) {
  testarAPIEndpoint()
    .then(() => {
      console.log('\n🏁 Teste finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { testarAPIEndpoint };





