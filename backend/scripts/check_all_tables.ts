import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔍 Verificando todas as tabelas do banco...');
    
    // Listar todas as tabelas
    const tables = await prisma.$queryRawUnsafe(`
      SHOW TABLES
    `);
    
    console.log('\n📋 Tabelas existentes:');
    (tables as any[]).forEach((table: any, index: number) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });
    
    // Verificar tabelas específicas que o sistema precisa
    console.log('\n🎯 Verificando tabelas essenciais:');
    
    const tabelasEssenciais = [
      'usuarios',
      'lojas', 
      'tokens_acesso',
      'estoque_localizacoes',
      'estoque_itens',
      'estoque_movimentacoes',
      'estoque_transferencias',
      'estoque_sobras',
      'estoque_aproveitamentos'
    ];
    
    for (const tabela of tabelasEssenciais) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as total FROM ${tabela} LIMIT 1
        `);
        console.log(`  ✅ ${tabela}: ${Number((result as any[])[0]?.total || 0)} registros`);
      } catch (e: any) {
        if (e.message.includes("doesn't exist")) {
          console.log(`  ❌ ${tabela}: TABELA NÃO EXISTE`);
        } else {
          console.log(`  ⚠️ ${tabela}: Erro - ${e.message}`);
        }
      }
    }
    
    // Verificar se há tabelas de autenticação
    console.log('\n🔐 Verificando tabelas de autenticação:');
    const authTables = ['usuarios', 'lojas', 'tokens_acesso'];
    
    for (const tabela of authTables) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as total FROM ${tabela} LIMIT 1
        `);
        console.log(`  ✅ ${tabela}: ${Number((result as any[])[0]?.total || 0)} registros`);
      } catch (e: any) {
        if (e.message.includes("doesn't exist")) {
          console.log(`  ❌ ${tabela}: TABELA NÃO EXISTE - AUTENTICAÇÃO NÃO FUNCIONARÁ`);
        } else {
          console.log(`  ⚠️ ${tabela}: Erro - ${e.message}`);
        }
      }
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
