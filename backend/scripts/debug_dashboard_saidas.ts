import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🔍 Debugando dashboard para loja: ${lojaId}`);
    
    // 1. Verificar todas as movimentações
    console.log('\n📋 Todas as movimentações:');
    const todasMovimentacoes = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        tipo, 
        quantidade, 
        dataMovimentacao, 
        observacoes,
        lojaId
      FROM estoque_movimentacoes 
      WHERE lojaId = ?
      ORDER BY dataMovimentacao DESC
    `, lojaId);
    
    if ((todasMovimentacoes as any[]).length > 0) {
      (todasMovimentacoes as any[]).forEach((mov: any, index: number) => {
        console.log(`  ${index + 1}. ${mov.tipo} - ${mov.quantidade} - ${mov.dataMovimentacao} - ${mov.observacoes || 'Sem observações'}`);
      });
    } else {
      console.log('  ❌ Nenhuma movimentação encontrada');
    }
    
    // 2. Verificar estatísticas por tipo (como o dashboard faz)
    console.log('\n📊 Estatísticas por tipo (EXATAMENTE como o dashboard):');
    const statsRows = await prisma.$queryRawUnsafe(`
      SELECT tipo, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
    `, lojaId);
    
    const estatisticas: any = { entradas: 0, saidas: 0, ajustes: 0, transferencias: 0 };
    (statsRows as any[]).forEach((r: any) => {
      estatisticas[r.tipo.toLowerCase()] = Number(r.total || 0);
    });
    
    console.log(`  - ENTRADAS: ${estatisticas.entrada || 0}`);
    console.log(`  - SAÍDAS: ${estatisticas.saida || 0}`);
    console.log(`  - AJUSTES: ${estatisticas.ajuste || 0}`);
    console.log(`  - TRANSFERÊNCIAS: ${estatisticas.transferencia || 0}`);
    
    // 3. Verificar especificamente as SAÍDAS
    console.log('\n🚪 Movimentações do tipo SAIDA:');
    const saidas = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        tipo, 
        quantidade, 
        dataMovimentacao, 
        observacoes
      FROM estoque_movimentacoes 
      WHERE lojaId = ? AND tipo = 'SAIDA'
      ORDER BY dataMovimentacao DESC
    `, lojaId);
    
    if ((saidas as any[]).length > 0) {
      (saidas as any[]).forEach((mov: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${mov.id} - Qtd: ${mov.quantidade} - Data: ${mov.dataMovimentacao}`);
      });
    } else {
      console.log('  ❌ Nenhuma movimentação do tipo SAIDA encontrada');
    }
    
    // 4. Verificar se há problemas de case sensitivity
    console.log('\n🔍 Verificando case sensitivity:');
    const tiposUnicos = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT tipo
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    
    console.log('  Tipos únicos encontrados:');
    (tiposUnicos as any[]).forEach((t: any, index: number) => {
      console.log(`    ${index + 1}. '${t.tipo}'`);
    });
    
    // 5. Verificar se há movimentações com tipos diferentes
    console.log('\n🔍 Verificando movimentações com tipos diferentes:');
    const movimentacoesDiferentes = await prisma.$queryRawUnsafe(`
      SELECT 
        tipo, 
        COUNT(*) as total,
        GROUP_CONCAT(id) as ids
      FROM estoque_movimentacoes 
      WHERE lojaId = ?
      GROUP BY tipo
      ORDER BY total DESC
    `, lojaId);
    
    (movimentacoesDiferentes as any[]).forEach((mov: any, index: number) => {
      console.log(`  ${index + 1}. Tipo: '${mov.tipo}' - Total: ${mov.total} - IDs: ${mov.ids}`);
    });
    
    // 6. Verificar se o problema está na query do dashboard
    console.log('\n🧪 Simulando query do dashboard:');
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
    console.log('  Resultado da query do dashboard:');
    console.log(`    - ENTRADAS: ${dashboard.entradas}`);
    console.log(`    - SAÍDAS: ${dashboard.saias}`);
    console.log(`    - AJUSTES: ${dashboard.ajustes}`);
    console.log(`    - TRANSFERÊNCIAS: ${dashboard.transferencias}`);
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
