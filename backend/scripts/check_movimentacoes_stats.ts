import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff'; // Substitua pelo ID da sua loja
    console.log(`🔍 Verificando estatísticas para loja: ${lojaId}`);
    
    // Verificar estrutura da tabela
    console.log('\n📋 Estrutura da tabela estoque_movimentacoes:');
    const columns = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'estoque_movimentacoes'
      ORDER BY ORDINAL_POSITION
    `);
    (columns as any[]).forEach((col: any) => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
    });
    
    // Verificar movimentações por tipo
    console.log('\n📊 Movimentações por tipo:');
    const stats = await prisma.$queryRawUnsafe(`
      SELECT tipo, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
    `, lojaId);
    
    if ((stats as any[]).length > 0) {
      (stats as any[]).forEach((stat: any) => {
        console.log(`  - ${stat.tipo}: ${stat.total}`);
      });
    } else {
      console.log('  ❌ Nenhuma movimentação encontrada');
    }
    
    // Verificar últimas movimentações
    console.log('\n🔄 Últimas 5 movimentações:');
    const movs = await prisma.$queryRawUnsafe(`
      SELECT 
        m.id,
        m.tipo,
        m.quantidade,
        m.dataMovimentacao,
        m.estoqueId,
        COALESCE(i.nome, '') as insumoNome
      FROM estoque_movimentacoes m
      LEFT JOIN estoque_itens i ON i.id = m.estoqueId
      WHERE m.lojaId = ?
      ORDER BY m.dataMovimentacao DESC
      LIMIT 5
    `, lojaId);
    
    if ((movs as any[]).length > 0) {
      (movs as any[]).forEach((mov: any, index: number) => {
        console.log(`  ${index + 1}. ${mov.tipo} - ${mov.insumoNome} (${mov.quantidade}) - ${mov.dataMovimentacao}`);
      });
    } else {
      console.log('  ❌ Nenhuma movimentação encontrada');
    }
    
    // Verificar itens abaixo do mínimo
    console.log('\n⚠️ Itens abaixo do mínimo:');
    const itensBaixo = await prisma.$queryRawUnsafe(`
      SELECT 
        id, codigo, nome, quantidadeAtual, estoqueMinimo
      FROM estoque_itens
      WHERE lojaId = ? 
      AND ativo = 1 
      AND quantidadeAtual <= estoqueMinimo 
      AND estoqueMinimo > 0
    `, lojaId);
    
    if ((itensBaixo as any[]).length > 0) {
      (itensBaixo as any[]).forEach((item: any) => {
        console.log(`  - ${item.nome}: ${item.quantidadeAtual}/${item.estoqueMinimo}`);
      });
    } else {
      console.log('  ✅ Nenhum item abaixo do mínimo');
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
