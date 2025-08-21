import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const itemId = 'item-1755525457295';
    console.log(`🔍 Verificando item: ${itemId}`);
    
    // Verificar se o item existe
    const item = await prisma.$queryRawUnsafe(`
      SELECT id, codigo, nome, lojaId, quantidadeAtual 
      FROM estoque_itens 
      WHERE id = ?
    `, itemId);
    
    if ((item as any[]).length > 0) {
      console.log('✅ Item encontrado:');
      console.log(JSON.stringify(item[0], null, 2));
    } else {
      console.log('❌ Item NÃO encontrado');
      
      // Listar alguns itens para ver a estrutura
      const items = await prisma.$queryRawUnsafe(`
        SELECT id, codigo, nome, lojaId, quantidadeAtual 
        FROM estoque_itens 
        LIMIT 5
      `);
      
      console.log('\n📋 Primeiros 5 itens da tabela:');
      (items as any[]).forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id} | Código: ${item.codigo} | Nome: ${item.nome}`);
      });
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
