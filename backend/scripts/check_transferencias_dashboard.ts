import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🔍 Verificando transferências e ajustes para loja: ${lojaId}`);
    
    // 1. Verificar todas as movimentações
    console.log('\n📋 Todas as movimentações:');
    const todasMovimentacoes = await prisma.$queryRawUnsafe(`
      SELECT 
        id, tipo, quantidade, dataMovimentacao, observacoes
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      ORDER BY dataMovimentacao DESC
    `, lojaId);
    
    (todasMovimentacoes as any[]).forEach((mov: any, index: number) => {
      console.log(`  ${index + 1}. ${mov.tipo} - ${mov.quantidade} - ${mov.dataMovimentacao} - ${mov.observacoes || 'Sem observações'}`);
    });
    
    // 2. Verificar transferências na tabela dedicada
    console.log('\n🔄 Transferências na tabela estoque_transferencias:');
    const transferencias = await prisma.$queryRawUnsafe(`
      SELECT 
        id, estoqueId, quantidade, status, dataTransferencia, observacoes
      FROM estoque_transferencias
      WHERE lojaId = ?
      ORDER BY dataTransferencia DESC
    `, lojaId);
    
    if ((transferencias as any[]).length > 0) {
      (transferencias as any[]).forEach((t: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${t.id} - Qtd: ${t.quantidade} - Status: ${t.status} - Data: ${t.dataTransferencia}`);
      });
    } else {
      console.log('  ❌ Nenhuma transferência encontrada na tabela estoque_transferencias');
    }
    
    // 3. Verificar estatísticas por tipo (como o dashboard faz)
    console.log('\n📊 Estatísticas por tipo (como o dashboard):');
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
    
    // 4. Verificar se há movimentações do tipo TRANSFERENCIA
    console.log('\n🔍 Movimentações do tipo TRANSFERENCIA:');
    const movsTransferencia = await prisma.$queryRawUnsafe(`
      SELECT 
        id, tipo, quantidade, dataMovimentacao, observacoes
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'TRANSFERENCIA'
      ORDER BY dataMovimentacao DESC
    `, lojaId);
    
    if ((movsTransferencia as any[]).length > 0) {
      (movsTransferencia as any[]).forEach((mov: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${mov.id} - Qtd: ${mov.quantidade} - Data: ${mov.dataMovimentacao}`);
      });
    } else {
      console.log('  ❌ Nenhuma movimentação do tipo TRANSFERENCIA encontrada');
    }
    
    // 5. Verificar se há movimentações do tipo AJUSTE
    console.log('\n🔧 Movimentações do tipo AJUSTE:');
    const movsAjuste = await prisma.$queryRawUnsafe(`
      SELECT 
        id, tipo, quantidade, dataMovimentacao, observacoes
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'AJUSTE'
      ORDER BY dataMovimentacao DESC
    `, lojaId);
    
    if ((movsAjuste as any[]).length > 0) {
      (movsAjuste as any[]).forEach((mov: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${mov.id} - Qtd: ${mov.quantidade} - Data: ${mov.dataMovimentacao}`);
      });
    } else {
      console.log('  ❌ Nenhuma movimentação do tipo AJUSTE encontrada');
    }
    
    // 6. Verificar se há movimentações do tipo SAIDA
    console.log('\n📤 Movimentações do tipo SAIDA:');
    const movsSaida = await prisma.$queryRawUnsafe(`
      SELECT 
        id, tipo, quantidade, dataMovimentacao, observacoes
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'SAIDA'
      ORDER BY dataMovimentacao DESC
    `, lojaId);
    
    if ((movsSaida as any[]).length > 0) {
      (movsSaida as any[]).forEach((mov: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${mov.id} - Qtd: ${mov.quantidade} - Data: ${mov.dataMovimentacao}`);
      });
    } else {
      console.log('  ❌ Nenhuma movimentação do tipo SAIDA encontrada');
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
