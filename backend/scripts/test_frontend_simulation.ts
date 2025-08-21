import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🧪 Simulando exatamente o que o frontend faz para loja: ${lojaId}`);
    
    // Simular o que o DashboardService faz (mesmo código)
    console.log('\n📊 Calculando estatísticas (como o frontend receberia):');
    
    // 1. Total de localizações
    const totalLocalizacoes = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM estoque_localizacoes 
      WHERE lojaId = ? AND ativo = 1
    `, lojaId);
    console.log(`📍 Total localizações: ${Number((totalLocalizacoes as any[])[0]?.total || 0)}`);
    
    // 2. Total de itens
    const totalItens = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM estoque_itens 
      WHERE lojaId = ? AND ativo = 1
    `, lojaId);
    console.log(`📦 Total itens: ${Number((totalItens as any[])[0]?.total || 0)}`);
    
    // 3. Total de movimentações
    const totalMovimentacoes = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM estoque_movimentacoes 
      WHERE lojaId = ?
    `, lojaId);
    console.log(`🔄 Total movimentações: ${Number((totalMovimentacoes as any[])[0]?.total || 0)}`);
    
    // 4. Itens abaixo do mínimo
    const itensAbaixoMinimo = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM estoque_itens 
      WHERE lojaId = ? 
      AND ativo = 1 
      AND quantidadeAtual <= estoqueMinimo 
      AND estoqueMinimo > 0
    `, lojaId);
    console.log(`⚠️ Itens abaixo do mínimo: ${Number((itensAbaixoMinimo as any[])[0]?.total || 0)}`);
    
    // 5. Valor total do estoque
    const valorTotalEstoque = await prisma.$queryRawUnsafe(`
      SELECT SUM(quantidadeAtual * precoUnitario) as valorTotal FROM estoque_itens 
      WHERE lojaId = ? AND ativo = 1
    `, lojaId);
    console.log(`💰 Valor total estoque: R$ ${Number((valorTotalEstoque as any[])[0]?.valorTotal || 0).toFixed(2)}`);
    
    // 6. Estatísticas por tipo (EXATAMENTE como o dashboard faz)
    console.log('\n📈 Estatísticas por tipo (EXATAMENTE como o dashboard):');
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
    
    // 7. Últimas movimentações (EXATAMENTE como o dashboard faz)
    console.log('\n🔄 Últimas 5 movimentações (EXATAMENTE como o dashboard):');
    const ultimasMovimentacoes = await prisma.$queryRawUnsafe(`
      SELECT 
        m.id,
        m.tipo,
        m.quantidade,
        m.dataMovimentacao,
        COALESCE(i.nome, '') as insumoNome,
        COALESCE(m.usuarioId, 'sistema') as usuarioNome
      FROM estoque_movimentacoes m
      LEFT JOIN estoque_itens i ON i.id = m.estoqueId
      WHERE m.lojaId = ?
      ORDER BY m.dataMovimentacao DESC
      LIMIT 5
    `, lojaId);
    
    (ultimasMovimentacoes as any[]).forEach((mov: any, index: number) => {
      console.log(`  ${index + 1}. ${mov.tipo} - ${mov.insumoNome} (${mov.quantidade}) - ${mov.dataMovimentacao}`);
    });
    
    // 8. Verificar se há discrepância
    console.log('\n🔍 Verificando se há discrepância:');
    const saidasCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM estoque_movimentacoes WHERE lojaId = ? AND tipo = 'SAIDA'
    `, lojaId);
    
    const saidasReal = Number((saidasCount as any[])[0]?.total || 0);
    const saidasDashboard = estatisticas.saida || 0;
    
    console.log(`  - SAÍDAS reais no banco: ${saidasReal}`);
    console.log(`  - SAÍDAS retornadas pelo dashboard: ${saidasDashboard}`);
    
    if (saidasReal === saidasDashboard) {
      console.log('  ✅ Dashboard retornando valor correto!');
    } else {
      console.log('  ❌ DISCREPÂNCIA ENCONTRADA!');
      console.log(`     Banco: ${saidasReal} | Dashboard: ${saidasDashboard}`);
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
