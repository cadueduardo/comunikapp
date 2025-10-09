/**
 * Script para corrigir materiais de OSs existentes
 * Objetivo: Sincronizar todas as OSs com seus orçamentos para corrigir quantidades irreais
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface InsumoCalculado {
  insumo_id: string;
  nome: string;
  quantidade_necessaria: number;
  unidade: string;
  custo_unitario: number;
  custo_total: number;
  produto_nome: string;
  logica_consumo?: string;
  parametros_consumo?: any;
  origem: 'orcamento' | 'os';
  orcamento_id?: string;
  data_calculo?: Date;
  disponivel_estoque: boolean;
  quantidade_disponivel?: number;
  localizacao_estoque?: string;
}

function extrairMateriaisDoOrcamento(orcamento: any): InsumoCalculado[] {
  const materiais: InsumoCalculado[] = [];

  if (!orcamento.produtos || !Array.isArray(orcamento.produtos)) {
    console.log(`⚠️  Orçamento ${orcamento.id} sem produtos válidos`);
    return materiais;
  }

  orcamento.produtos.forEach(produto => {
    if (!produto.insumos || !Array.isArray(produto.insumos)) {
      console.log(`⚠️  Produto ${produto.nome} sem insumos válidos`);
      return;
    }

    produto.insumos.forEach(itemInsumo => {
      if (!itemInsumo.insumo) {
        console.log(`⚠️  ItemInsumo ${itemInsumo.id} sem insumo associado`);
        return;
      }

      // Usar dados exatos do orçamento
      materiais.push({
        insumo_id: itemInsumo.insumo.id,
        nome: itemInsumo.insumo.nome,
        quantidade_necessaria: parseFloat(itemInsumo.quantidade || '0'),
        unidade: itemInsumo.unidade || itemInsumo.insumo.unidade_uso || 'un',
        custo_unitario: parseFloat(itemInsumo.custo_unitario || '0'),
        custo_total: parseFloat(itemInsumo.custo_total || '0'),
        produto_nome: produto.nome || 'Produto sem nome',
        logica_consumo: itemInsumo.insumo.logica_consumo || 'area',
        parametros_consumo: itemInsumo.insumo.parametros_consumo ? 
          (typeof itemInsumo.insumo.parametros_consumo === 'string' ? 
            JSON.parse(itemInsumo.insumo.parametros_consumo) : 
            itemInsumo.insumo.parametros_consumo) : null,
        origem: 'orcamento',
        orcamento_id: orcamento.id,
        data_calculo: orcamento.data_ultimo_calculo || orcamento.criado_em,
        disponivel_estoque: false,
        quantidade_disponivel: 0,
        localizacao_estoque: null
      });
    });
  });

  return materiais;
}

async function migrarOSsExistentes() {
  console.log('🚀 Iniciando migração de materiais de OSs existentes...\n');

  try {
    // 1. Buscar todas as OSs que têm orçamento vinculado
    const osComOrcamento = await prisma.ordemServico.findMany({
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

    console.log(`📊 Encontradas ${osComOrcamento.length} OSs com orçamento vinculado\n`);

    let sucessos = 0;
    let erros = 0;

    // 2. Processar cada OS
    for (const os of osComOrcamento) {
      try {
        console.log(`🔧 Processando OS ${os.numero} (ID: ${os.id})...`);

        if (!os.orcamento) {
          console.log(`⚠️  OS ${os.numero} sem orçamento válido, pulando...`);
          continue;
        }

        // 3. Extrair materiais corretos do orçamento
        const materiaisCorretos = extrairMateriaisDoOrcamento(os.orcamento);

        if (materiaisCorretos.length === 0) {
          console.log(`⚠️  OS ${os.numero} sem materiais no orçamento, pulando...`);
          continue;
        }

        // 4. Atualizar OS com materiais corretos
        await prisma.ordemServico.update({
          where: { id: os.id },
          data: {
            insumos_calculados: JSON.stringify(materiaisCorretos),
            atualizado_em: new Date()
          }
        });

        console.log(`✅ OS ${os.numero} atualizada com ${materiaisCorretos.length} materiais`);
        sucessos++;

      } catch (error) {
        console.error(`❌ Erro ao processar OS ${os.numero}:`, error.message);
        erros++;
      }
    }

    console.log('\n📈 RESUMO DA MIGRAÇÃO:');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📊 Total processado: ${sucessos + erros}`);

    if (erros === 0) {
      console.log('\n🎉 Migração concluída com sucesso! Todas as OSs foram corrigidas.');
    } else {
      console.log(`\n⚠️  Migração concluída com ${erros} erros. Verifique os logs acima.`);
    }

  } catch (error) {
    console.error('💥 Erro fatal durante a migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
if (require.main === module) {
  migrarOSsExistentes()
    .then(() => {
      console.log('\n🏁 Script finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { migrarOSsExistentes };





