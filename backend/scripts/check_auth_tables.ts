import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🔍 Verificando tabelas de autenticação...');
    
    // Verificar tabelas que podem existir com nomes diferentes
    const possiveisTabelas = [
      'usuario', 'usuarios', 'user', 'users',
      'loja', 'lojas', 'store', 'stores',
      'tokens_acesso', 'access_tokens', 'tokens', 'auth_tokens'
    ];
    
    console.log('\n📋 Verificando tabelas de usuários:');
    for (const tabela of ['usuario', 'usuarios', 'user', 'users']) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as total FROM ${tabela} LIMIT 1
        `);
        console.log(`  ✅ ${tabela}: ${Number((result as any[])[0]?.total || 0)} registros`);
        
        // Se encontrou, mostrar estrutura
        if (Number((result as any[])[0]?.total || 0) > 0) {
          const columns = await prisma.$queryRawUnsafe(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = '${tabela}'
            ORDER BY ORDINAL_POSITION
          `);
          console.log(`    📋 Colunas: ${(columns as any[]).map((col: any) => col.COLUMN_NAME).join(', ')}`);
        }
      } catch (e: any) {
        if (e.message.includes("doesn't exist")) {
          console.log(`  ❌ ${tabela}: TABELA NÃO EXISTE`);
        } else {
          console.log(`  ⚠️ ${tabela}: Erro - ${e.message}`);
        }
      }
    }
    
    console.log('\n🏪 Verificando tabelas de lojas:');
    for (const tabela of ['loja', 'lojas', 'store', 'stores']) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as total FROM ${tabela} LIMIT 1
        `);
        console.log(`  ✅ ${tabela}: ${Number((result as any[])[0]?.total || 0)} registros`);
        
        // Se encontrou, mostrar estrutura
        if (Number((result as any[])[0]?.total || 0) > 0) {
          const columns = await prisma.$queryRawUnsafe(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = '${tabela}'
            ORDER BY ORDINAL_POSITION
          `);
          console.log(`    📋 Colunas: ${(columns as any[]).map((col: any) => col.COLUMN_NAME).join(', ')}`);
        }
      } catch (e: any) {
        if (e.message.includes("doesn't exist")) {
          console.log(`  ❌ ${tabela}: TABELA NÃO EXISTE`);
        } else {
          console.log(`  ⚠️ ${tabela}: Erro - ${e.message}`);
        }
      }
    }
    
    console.log('\n🔑 Verificando tabelas de tokens:');
    for (const tabela of ['tokens_acesso', 'access_tokens', 'tokens', 'auth_tokens']) {
      try {
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as total FROM ${tabela} LIMIT 1
        `);
        console.log(`  ✅ ${tabela}: ${Number((result as any[])[0]?.total || 0)} registros`);
        
        // Se encontrou, mostrar estrutura
        if (Number((result as any[])[0]?.total || 0) > 0) {
          const columns = await prisma.$queryRawUnsafe(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = '${tabela}'
            ORDER BY ORDINAL_POSITION
          `);
          console.log(`    📋 Colunas: ${(columns as any[]).map((col: any) => col.COLUMN_NAME).join(', ')}`);
        }
      } catch (e: any) {
        if (e.message.includes("doesn't exist")) {
          console.log(`  ❌ ${tabela}: TABELA NÃO EXISTE`);
        } else {
          console.log(`  ⚠️ ${tabela}: Erro - ${e.message}`);
        }
      }
    }
    
    // Verificar se há dados nas tabelas que existem
    console.log('\n📊 Verificando dados nas tabelas existentes:');
    
    try {
      const usuarios = await prisma.$queryRawUnsafe(`
        SELECT id, nome, email, ativo FROM usuario LIMIT 5
      `);
      console.log(`  👤 Usuários em 'usuario': ${(usuarios as any[]).length}`);
      if ((usuarios as any[]).length > 0) {
        (usuarios as any[]).forEach((u: any, index: number) => {
          console.log(`    ${index + 1}. ${u.nome} (${u.email}) - Ativo: ${u.ativo}`);
        });
      }
    } catch (e: any) {
      console.log(`  ❌ Erro ao acessar 'usuario': ${e.message}`);
    }
    
    try {
      const lojas = await prisma.$queryRawUnsafe(`
        SELECT id, nome, email, ativo FROM loja LIMIT 5
      `);
      console.log(`  🏪 Lojas em 'loja': ${(lojas as any[]).length}`);
      if ((lojas as any[]).length > 0) {
        (lojas as any[]).forEach((l: any, index: number) => {
          console.log(`    ${index + 1}. ${l.nome} (${l.email}) - Ativo: ${l.ativo}`);
        });
      }
    } catch (e: any) {
      console.log(`  ❌ Erro ao acessar 'loja': ${e.message}`);
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
