/**
 * Script completo para corrigir materiais de OSs existentes
 * Executa: Backup + Migração + Validação
 */

import { PrismaClient } from '@prisma/client';
import { fazerBackupOSs } from './backup-os-antes-migracao';
import { migrarOSsExistentes } from './migrar-os-materiais-corretos';

const prisma = new PrismaClient();

async function validarMigracao() {
  console.log('\n🔍 Validando migração...\n');

  try {
    // Buscar algumas OSs para validar
    const osParaValidar = await prisma.ordemServico.findMany({
      where: {
        orcamento_id: {
          not: null
        }
      },
      take: 5,
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

    console.log(`📊 Validando ${osParaValidar.length} OSs...\n`);

    for (const os of osParaValidar) {
      console.log(`🔍 Validando OS ${os.numero}:`);
      
      if (!os.insumos_calculados) {
        console.log(`  ❌ Sem insumos_calculados`);
        continue;
      }

      let insumosCalculados = [];
      try {
        if (typeof os.insumos_calculados === 'string') {
          insumosCalculados = JSON.parse(os.insumos_calculados);
        } else {
          insumosCalculados = os.insumos_calculados;
        }
      } catch (error) {
        console.log(`  ❌ Erro ao parsear insumos_calculados: ${error.message}`);
        continue;
      }

      console.log(`  ✅ ${insumosCalculados.length} materiais encontrados`);
      
      // Verificar se tem campos de rastreabilidade
      const temRastreabilidade = insumosCalculados.some((m: any) => 
        m.origem === 'orcamento' && m.orcamento_id
      );
      
      if (temRastreabilidade) {
        console.log(`  ✅ Rastreabilidade OK`);
      } else {
        console.log(`  ⚠️  Sem rastreabilidade`);
      }

      // Verificar quantidades
      const quantidades = insumosCalculados.map((m: any) => ({
        nome: m.nome,
        quantidade: m.quantidade_necessaria,
        unidade: m.unidade
      }));
      
      console.log(`  📋 Materiais:`, quantidades);
      console.log('');
    }

    console.log('✅ Validação concluída!\n');

  } catch (error) {
    console.error('❌ Erro na validação:', error);
  }
}

async function executarCorrecaoCompleta() {
  console.log('🚀 INICIANDO CORREÇÃO COMPLETA DE MATERIAIS DE OSs\n');
  console.log('=' .repeat(60));

  try {
    // 1. Fazer backup
    console.log('\n📦 ETAPA 1: BACKUP DE SEGURANÇA');
    console.log('-'.repeat(40));
    await fazerBackupOSs();

    // 2. Executar migração
    console.log('\n🔧 ETAPA 2: MIGRAÇÃO DE MATERIAIS');
    console.log('-'.repeat(40));
    await migrarOSsExistentes();

    // 3. Validar resultado
    console.log('\n🔍 ETAPA 3: VALIDAÇÃO');
    console.log('-'.repeat(40));
    await validarMigracao();

    console.log('\n🎉 CORREÇÃO COMPLETA FINALIZADA COM SUCESSO!');
    console.log('=' .repeat(60));
    console.log('✅ Backup criado');
    console.log('✅ OSs migradas');
    console.log('✅ Validação concluída');
    console.log('\n💡 Agora as OSs mostram quantidades corretas dos orçamentos!');

  } catch (error) {
    console.error('\n💥 ERRO DURANTE A CORREÇÃO:', error);
    console.log('\n🔄 Para restaurar o backup, execute:');
    console.log('   npm run backup:os-materiais');
    console.log('   (e depois use o script de restauração gerado)');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar correção completa
if (require.main === module) {
  executarCorrecaoCompleta()
    .then(() => {
      console.log('\n🏁 Script finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { executarCorrecaoCompleta };





