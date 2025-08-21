import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const itemId = 'item-1755525457295';
    console.log(`🔍 Verificando estoque mínimo do item: ${itemId}`);
    
    // Verificar configuração do item
    const item = await prisma.$queryRawUnsafe(`
      SELECT 
        id, codigo, nome, 
        quantidadeAtual, 
        estoqueMinimo, 
        estoqueMaximo,
        ativo
      FROM estoque_itens 
      WHERE id = ?
    `, itemId);
    
    if ((item as any[]).length > 0) {
      const i = (item as any[])[0];
      console.log('📋 Configuração do item:');
      console.log(`  - Nome: ${i.nome}`);
      console.log(`  - Quantidade Atual: ${i.quantidadeAtual}`);
      console.log(`  - Estoque Mínimo: ${i.estoqueMinimo}`);
      console.log(`  - Estoque Máximo: ${i.estoqueMaximo}`);
      console.log(`  - Ativo: ${i.ativo}`);
      
      // Verificar se está abaixo do mínimo
      if (i.estoqueMinimo > 0 && i.quantidadeAtual <= i.estoqueMinimo) {
        console.log(`\n⚠️ ALERTA: Item abaixo do mínimo!`);
        console.log(`  Quantidade atual (${i.quantidadeAtual}) <= Mínimo (${i.estoqueMinimo})`);
      } else if (i.estoqueMinimo === 0 || i.estoqueMinimo === null) {
        console.log(`\nℹ️ Estoque mínimo não configurado (${i.estoqueMinimo})`);
      } else {
        console.log(`\n✅ Item OK: Quantidade atual (${i.quantidadeAtual}) > Mínimo (${i.estoqueMinimo})`);
      }
    } else {
      console.log('❌ Item não encontrado');
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
