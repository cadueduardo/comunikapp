import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    // Verificar se existe tabela de transferências
    const transferenciasTable = await prisma.$queryRawUnsafe<any[]>('SHOW TABLES LIKE "estoque_transferencias"');
    console.log('=== Tabela estoque_transferencias ===');
    if (transferenciasTable.length > 0) {
      console.log('✅ Tabela existe!');
      const cols = await prisma.$queryRawUnsafe<any[]>('DESCRIBE estoque_transferencias');
      console.log('Colunas:');
      for (const c of cols) {
        console.log(`${c.Field || c.COLUMN_NAME}\t${c.Type || ''}`);
      }
    } else {
      console.log('❌ Tabela NÃO existe');
    }

    // Verificar tabela de movimentações
    console.log('\n=== Tabela estoque_movimentacoes ===');
    const cols = await prisma.$queryRawUnsafe<any[]>('DESCRIBE estoque_movimentacoes');
    for (const c of cols) {
      console.log(`${c.Field || c.COLUMN_NAME}\t${c.Type || ''}`);
    }

    // Verificar se há movimentações de transferência
    console.log('\n=== Movimentações de Transferência ===');
    const movimentacoes = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, estoqueId, tipo, quantidade, observacoes, dataMovimentacao 
      FROM estoque_movimentacoes 
      WHERE observacoes LIKE '%Transferência%' 
      ORDER BY dataMovimentacao DESC 
      LIMIT 5
    `);
    
    if (movimentacoes.length > 0) {
      console.log('Movimentações encontradas:');
      for (const m of movimentacoes) {
        console.log(`- ${m.id}: ${m.tipo} ${m.quantidade} (${m.observacoes}) - ${m.dataMovimentacao}`);
      }
    } else {
      console.log('Nenhuma movimentação de transferência encontrada');
    }

    // Verificar movimentações por tipo
    console.log('\n=== Movimentações por Tipo ===');
    const tipos = await prisma.$queryRawUnsafe<any[]>(`
      SELECT tipo, COUNT(*) as total 
      FROM estoque_movimentacoes 
      GROUP BY tipo
    `);
    
    for (const t of tipos) {
      console.log(`- ${t.tipo}: ${t.total}`);
    }

  } catch (e) {
    console.error('Erro:', e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
