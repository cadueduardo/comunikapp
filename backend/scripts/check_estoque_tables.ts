import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔍 Verificando tabelas do módulo de estoque...\n');
    
    // Lista de tabelas esperadas
    const expectedTables = [
      'estoque_localizacoes',
      'estoque_itens', 
      'estoque_movimentacoes',
      'estoque_lotes',
      'estoque_transferencias',
      'estoque_sobras',
      'estoque_aproveitamentos',
      'estoque_relatorios'
    ];
    
    for (const tableName of expectedTables) {
      console.log(`=== ${tableName} ===`);
      try {
        const tableExists = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE '${tableName}'`);
        if ((tableExists as any[]).length > 0) {
          console.log('✅ Tabela existe!');
          const cols = await prisma.$queryRawUnsafe(`DESCRIBE ${tableName}`);
          console.log(`Colunas (${(cols as any[]).length}):`);
          for (const c of cols as any[]) {
            console.log(`  - ${c.Field}\t${c.Type}`);
          }
        } else {
          console.log('❌ Tabela NÃO existe');
        }
      } catch (e: any) {
        console.log(`❌ Erro ao verificar: ${e.message}`);
      }
      console.log('');
    }
    
    // Verificar tabelas que podem ter nomes diferentes
    console.log('=== Verificando outras tabelas relacionadas ===');
    const allTables = await prisma.$queryRawUnsafe('SHOW TABLES');
    const estoqueTables = (allTables as any[]).filter((t: any) => {
      const tableName = Object.values(t)[0];
      return tableName.toString().toLowerCase().includes('estoque') ||
             tableName.toString().toLowerCase().includes('sobra') ||
             tableName.toString().toLowerCase().includes('lote') ||
             tableName.toString().toLowerCase().includes('transferencia');
    });
    
    if (estoqueTables.length > 0) {
      console.log('Tabelas encontradas com nomes relacionados:');
      for (const t of estoqueTables) {
        const tableName = Object.values(t)[0];
        console.log(`  - ${tableName}`);
      }
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
