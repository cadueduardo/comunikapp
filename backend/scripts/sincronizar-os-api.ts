#!/usr/bin/env ts-node

/**
 * Script para sincronizar OSs existentes via API
 * Usa o endpoint PATCH /os/:id/sincronizar-orcamento
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sincronizarOSsViaAPI() {
  console.log('🔄 Iniciando sincronização de OSs via API...\n');

  try {
    // Buscar todas as OSs que possuem orçamento vinculado
    const osComOrcamento = await prisma.ordemServico.findMany({
      where: {
        orcamento_id: {
          not: null
        }
      },
      select: {
        id: true,
        numero: true,
        loja_id: true,
        orcamento_id: true
      },
      orderBy: {
        criado_em: 'desc'
      }
    });

    console.log(`📊 Encontradas ${osComOrcamento.length} OSs com orçamento vinculado\n`);

    if (osComOrcamento.length === 0) {
      console.log('✅ Nenhuma OS encontrada para sincronização');
      return;
    }

    // URL base da API (ajuste conforme necessário)
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    console.log('📋 Para sincronizar as OSs, execute os seguintes comandos:\n');
    
    osComOrcamento.forEach((os, index) => {
      console.log(`${index + 1}. OS ${os.numero} (ID: ${os.id})`);
      console.log(`   curl -X PATCH "${baseUrl}/os/${os.id}/sincronizar-orcamento" \\`);
      console.log(`        -H "Authorization: Bearer SEU_TOKEN_AQUI" \\`);
      console.log(`        -H "Content-Type: application/json"`);
      console.log('');
    });

    console.log('💡 DICA: Substitua "SEU_TOKEN_AQUI" pelo token de autenticação válido');
    console.log('💡 DICA: Execute os comandos um por vez ou use um script de automação');

  } catch (error) {
    console.error('❌ Erro na execução do script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
if (require.main === module) {
  sincronizarOSsViaAPI()
    .then(() => {
      console.log('\n✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

export { sincronizarOSsViaAPI };









