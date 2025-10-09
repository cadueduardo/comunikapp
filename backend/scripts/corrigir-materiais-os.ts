#!/usr/bin/env ts-node

/**
 * Script para corrigir materiais de OSs existentes
 * Aplica a nova lógica de cálculo de materiais em todas as OSs cadastradas
 */

import { PrismaClient } from '@prisma/client';
import { OSService } from '../src/os/services/os.service';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaClient();

async function corrigirMateriaisOS() {
  console.log('🔧 Iniciando correção de materiais de OSs existentes...\n');

  try {
    // Buscar todas as OSs que possuem orçamento vinculado
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
      },
      orderBy: {
        criado_em: 'desc'
      }
    });

    console.log(`📊 Encontradas ${osComOrcamento.length} OSs com orçamento vinculado\n`);

    if (osComOrcamento.length === 0) {
      console.log('✅ Nenhuma OS encontrada para correção');
      return;
    }

    // Criar instância do serviço
    const prismaService = new PrismaService();
    const osService = new OSService(
      prismaService,
      null as any, // documentCodeService
      null as any, // validacaoEstoqueService
      null as any, // alcadasOrcamentoService
      null as any, // eventosAutomaticosService
      null as any  // osApprovalPermissionsService
    );

    let sucessos = 0;
    let erros = 0;
    const errosDetalhes: Array<{ osId: string; erro: string }> = [];

    // Processar cada OS
    for (const os of osComOrcamento) {
      try {
        console.log(`🔄 Processando OS ${os.numero} (ID: ${os.id})...`);
        
        // Aplicar correção usando a função sincronizarComOrcamento
        const resultado = await osService.sincronizarComOrcamento(os.id, os.loja_id);
        
        if (resultado.sucesso) {
          console.log(`  ✅ OS ${os.numero} corrigida com sucesso`);
          console.log(`     📦 ${resultado.materiais.length} materiais atualizados`);
          
          // Mostrar exemplo de material corrigido
          if (resultado.materiais.length > 0) {
            const primeiroMaterial = resultado.materiais[0];
            console.log(`     📋 Exemplo: ${primeiroMaterial.nome} - ${primeiroMaterial.display}`);
          }
          
          sucessos++;
        } else {
          console.log(`  ❌ Falha na correção da OS ${os.numero}`);
          erros++;
        }
        
      } catch (error) {
        console.log(`  ❌ Erro ao processar OS ${os.numero}: ${error.message}`);
        errosDetalhes.push({
          osId: os.id,
          erro: error.message
        });
        erros++;
      }
      
      console.log(''); // Linha em branco para separar
    }

    // Relatório final
    console.log('📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ OSs corrigidas com sucesso: ${sucessos}`);
    console.log(`❌ OSs com erro: ${erros}`);
    console.log(`📦 Total processado: ${osComOrcamento.length}`);
    
    if (errosDetalhes.length > 0) {
      console.log('\n🔍 DETALHES DOS ERROS:');
      errosDetalhes.forEach(({ osId, erro }) => {
        console.log(`  - OS ${osId}: ${erro}`);
      });
    }

    console.log('\n🎉 Correção de materiais concluída!');

  } catch (error) {
    console.error('❌ Erro geral na execução do script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
if (require.main === module) {
  corrigirMateriaisOS()
    .then(() => {
      console.log('\n✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

export { corrigirMateriaisOS };




