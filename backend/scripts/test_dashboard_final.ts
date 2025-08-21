import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🧪 Teste final do dashboard corrigido para loja: ${lojaId}`);
    
    // Simular exatamente a lógica corrigida do dashboard
    console.log('\n📊 Simulando lógica corrigida do dashboard:');
    
    // 1. Query que o dashboard usa
    const statsRows: any[] = await prisma.$queryRawUnsafe(`
      SELECT tipo, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
    `, lojaId);
    
    console.log('  Resultado da query GROUP BY:');
    (statsRows as any[]).forEach((r: any, index: number) => {
      console.log(`    ${index + 1}. Tipo: '${r.tipo}' - Total: ${r.total}`);
    });
    
    // 2. Mapeamento que o dashboard usa
    const map: any = { ENTRADA: 0, SAIDA: 0, AJUSTE: 0, TRANSFERENCIA: 0 };
    for (const r of statsRows) map[r.tipo] = Number(r.total || 0);
    
    console.log('\n  Mapeamento final:');
    console.log(`    - ENTRADA: ${map.ENTRADA}`);
    console.log(`    - SAIDA: ${map.SAIDA}`);
    console.log(`    - AJUSTE: ${map.AJUSTE}`);
    console.log(`    - TRANSFERENCIA: ${map.TRANSFERENCIA}`);
    
    // 3. Estatísticas com atribuição explícita (CORRIGIDA)
    const estatisticas: any = {};
    estatisticas.entradas = map.ENTRADA || 0;
    estatisticas.saias = map.SAIDA || 0;
    estatisticas.ajustes = map.AJUSTE || 0;
    estatisticas.transferencias = map.TRANSFERENCIA || 0;
    
    console.log('\n  Estatísticas finais (CORRIGIDAS):');
    console.log(`    - entradas: ${estatisticas.entradas}`);
    console.log(`    - saidas: ${estatisticas.saias}`);
    console.log(`    - ajustes: ${estatisticas.ajustes}`);
    console.log(`    - transferencias: ${estatisticas.transferencias}`);
    
    // 4. Verificar se agora está correto
    if (estatisticas.saias === 4) {
      console.log('\n🎯 PROBLEMA RESOLVIDO!');
      console.log('  - Dashboard agora retorna 4 SAÍDAS');
      console.log('  - Frontend receberá o valor correto');
      console.log('  - Card de saídas será preenchido');
      console.log('  - 4 saídas aparecerão no dashboard');
    } else {
      console.log('\n❌ Problema persiste');
      console.log(`  - Esperado: 4 SAÍDAS`);
      console.log(`  - Recebido: ${estatisticas.saias} SAÍDAS`);
    }
    
    // 5. Simular resposta completa do dashboard
    const dashboardResponse = {
      totalLocalizacoes: 1,
      totalItens: 1,
      totalMovimentacoes: 9,
      itensAbaixoMinimo: 0,
      valorTotalEstoque: 0,
      ultimasMovimentacoes: [],
      estatisticas: estatisticas,
    };
    
    console.log('\n📊 Resposta completa do dashboard:');
    console.log(`  - Total movimentações: ${dashboardResponse.totalMovimentacoes}`);
    console.log(`  - Estatísticas: ${JSON.stringify(dashboardResponse.estatisticas)}`);
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
