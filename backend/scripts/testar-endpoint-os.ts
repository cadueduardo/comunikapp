/**
 * Script para testar o endpoint da API de OS
 */

import { PrismaClient } from '@prisma/client';
import { OSService } from '../src/os/services/os.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Logger } from '@nestjs/common';

const prisma = new PrismaClient();

async function testarEndpointOS() {
  console.log('🔍 Testando dados da OS diretamente...\n');

  try {
    // Buscar uma OS
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

    // Verificar insumos_calculados
    console.log('📊 Dados brutos da OS:');
    console.log(`   Número: ${os.numero}`);
    console.log(`   Orçamento ID: ${os.orcamento_id}`);
    console.log(`   Insumos Calculados: ${os.insumos_calculados ? 'Presente' : 'Ausente'}`);
    console.log(`   Atualizado em: ${os.atualizado_em}`);

    if (os.insumos_calculados) {
      try {
        const insumosCalculados = JSON.parse(os.insumos_calculados);
        console.log(`\n📦 Insumos Calculados (${insumosCalculados.length} itens):`);
        insumosCalculados.forEach((insumo: any, index: number) => {
          console.log(`   ${index + 1}. ${insumo.nome}`);
          console.log(`      Display: ${insumo.display}`);
          console.log(`      Disponível: ${insumo.disponivel_estoque ? 'Sim' : 'Não'}`);
          console.log(`      Quantidade: ${insumo.quantidade_necessaria} ${insumo.unidade}`);
        });
      } catch (error) {
        console.log('❌ Erro ao parsear insumos_calculados:', error.message);
      }
    }

    // Verificar dados do orçamento
    if (os.orcamento && os.orcamento.produtos) {
      console.log(`\n📊 Produtos do Orçamento (${os.orcamento.produtos.length} produtos):`);
      os.orcamento.produtos.forEach((produto: any, index: number) => {
        console.log(`\n${index + 1}. ${produto.nome}:`);
        if (produto.insumos && produto.insumos.length > 0) {
          produto.insumos.forEach((itemInsumo: any, matIndex: number) => {
            console.log(`   ${matIndex + 1}. ${itemInsumo.insumo.nome}`);
            console.log(`      Quantidade: ${itemInsumo.quantidade} ${itemInsumo.unidade}`);
            console.log(`      Lógica: ${itemInsumo.insumo.logica_consumo}`);
          });
        } else {
          console.log('   ❌ Nenhum insumo encontrado');
        }
      });
    }

  } catch (error) {
    console.error('💥 Erro ao testar endpoint:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
if (require.main === module) {
  testarEndpointOS()
    .then(() => {
      console.log('\n🏁 Teste finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { testarEndpointOS };
