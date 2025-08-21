import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🧪 Testando dashboard corrigido para loja: ${lojaId}`);
    
    // Simular exatamente a query do dashboard corrigida
    console.log('\n📊 Simulando query do dashboard corrigida:');
    const dashboardQuery = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(CASE WHEN tipo = 'ENTRADA' THEN 1 END) as entradas,
        COUNT(CASE WHEN tipo = 'SAIDA' THEN 1 END) as saidas,
        COUNT(CASE WHEN tipo = 'AJUSTE' THEN 1 END) as ajustes,
        COUNT(CASE WHEN tipo = 'TRANSFERENCIA' THEN 1 END) as transferencias
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    
    const dashboard = (dashboardQuery as any[])[0];
    console.log('  Resultado da query corrigida:');
    console.log(`    - ENTRADAS: ${dashboard.entradas}`);
    console.log(`    - SAÍDAS: ${dashboard.saias}`);
    console.log(`    - AJUSTES: ${dashboard.ajustes}`);
    console.log(`    - TRANSFERÊNCIAS: ${dashboard.transferencias}`);
    
    // Verificar se agora está retornando o valor correto
    if (dashboard.saias === 4) {
      console.log('\n✅ PROBLEMA RESOLVIDO!');
      console.log('  - Dashboard agora retorna 4 SAÍDAS');
      console.log('  - Frontend receberá o valor correto');
      console.log('  - Card de saídas será preenchido');
    } else {
      console.log('\n❌ Problema persiste');
      console.log(`  - Esperado: 4 SAÍDAS`);
      console.log(`  - Recebido: ${dashboard.saias} SAÍDAS`);
    }
    
    // Verificar todas as movimentações para confirmar
    console.log('\n📋 Confirmando movimentações no banco:');
    const todasMovimentacoes = await prisma.$queryRawUnsafe(`
      SELECT tipo, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
      ORDER BY total DESC
    `, lojaId);
    
    (todasMovimentacoes as any[]).forEach((mov: any, index: number) => {
      console.log(`  ${index + 1}. ${mov.tipo}: ${mov.total}`);
    });
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
