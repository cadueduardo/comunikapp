/**
 * Script para testar a API de OS e verificar se está retornando os dados corretos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testarAPIOS() {
  console.log('🔍 Testando API de OS...\n');

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
                    insumo: true
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

    // Simular o que o formatarOrdemServico faria
    const produtos = os.orcamento?.produtos || [];
    const produtosFormatados = produtos.map(produto => {
      const materiais = produto.insumos?.map(itemInsumo => {
        // Simular a lógica do formatarOrdemServico
        let insumosCalculados = [];
        if (os.insumos_calculados) {
          try {
            insumosCalculados = JSON.parse(os.insumos_calculados);
          } catch (error) {
            console.log('❌ Erro ao parsear insumos_calculados:', error.message);
          }
        }

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
          categoria: 'Sem categoria', // TODO: Incluir categoria no include
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
    });

    console.log('📊 Produtos formatados:');
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
  testarAPIOS()
    .then(() => {
      console.log('\n🏁 Teste finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { testarAPIOS };
