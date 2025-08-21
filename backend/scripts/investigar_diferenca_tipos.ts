import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🔍 INVESTIGANDO DIFERENÇA ENTRE TIPOS para loja: ${lojaId}`);
    
    // 1. VERIFICAR EXATAMENTE O QUE O DASHBOARD ESTÁ FAZENDO
    console.log('\n📊 EXATAMENTE o que o dashboard está fazendo:');
    
    // Query que o dashboard usa
    const statsRows: any[] = await prisma.$queryRawUnsafe(`
      SELECT tipo, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
    `, lojaId);
    
    console.log('  Resultado da query GROUP BY:');
    (statsRows as any[]).forEach((r: any, index: number) => {
      console.log(`    ${index + 1}. Tipo: '${r.tipo}' - Total: ${r.total}`);
    });
    
    // 2. VERIFICAR CADA TIPO INDIVIDUALMENTE
    console.log('\n🔍 VERIFICANDO cada tipo individualmente:');
    
    // ENTRADA
    const entradaCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'ENTRADA'
    `, lojaId);
    console.log(`  - ENTRADA: ${(entradaCount as any[])[0]?.total} (Dashboard mostra: 2)`);
    
    // SAIDA
    const saidaCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'SAIDA'
    `, lojaId);
    console.log(`  - SAIDA: ${(saidaCount as any[])[0]?.total} (Dashboard mostra: 0) ← PROBLEMA AQUI!`);
    
    // AJUSTE
    const ajusteCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'AJUSTE'
    `, lojaId);
    console.log(`  - AJUSTE: ${(ajusteCount as any[])[0]?.total} (Dashboard mostra: 1)`);
    
    // TRANSFERENCIA
    const transferenciaCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'TRANSFERENCIA'
    `, lojaId);
    console.log(`  - TRANSFERENCIA: ${(transferenciaCount as any[])[0]?.total} (Dashboard mostra: 2)`);
    
    // 3. VERIFICAR SE HÁ PROBLEMA COM A TABELA
    console.log('\n🏗️ VERIFICANDO se há problema com a tabela:');
    
    // Verificar se a tabela existe
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'estoque_movimentacoes'
    `);
    console.log(`  - Tabela 'estoque_movimentacoes' existe: ${(tableExists as any[])[0]?.total > 0 ? '✅ SIM' : '❌ NÃO'}`);
    
    // Verificar estrutura da tabela
    const tableStructure = await prisma.$queryRawUnsafe(`
      DESCRIBE estoque_movimentacoes
    `);
    console.log('  - Estrutura da tabela:');
    (tableStructure as any[]).forEach((col: any, index: number) => {
      console.log(`    ${index + 1}. ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });
    
    // 4. VERIFICAR SE HÁ PROBLEMA COM O CAMPO 'tipo'
    console.log('\n🔍 VERIFICANDO campo "tipo":');
    
    // Verificar se há valores nulos no campo tipo
    const tiposNulos = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND (tipo IS NULL OR tipo = '')
    `, lojaId);
    console.log(`  - Movimentações com tipo NULL ou vazio: ${(tiposNulos as any[])[0]?.total}`);
    
    // Verificar se há problemas de case sensitivity
    const tiposCaseSensitive = await prisma.$queryRawUnsafe(`
      SELECT tipo, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
      ORDER BY tipo
    `, lojaId);
    console.log('  - Tipos encontrados (case sensitive):');
    (tiposCaseSensitive as any[]).forEach((t: any, index: number) => {
      console.log(`    ${index + 1}. '${t.tipo}' - Total: ${t.total}`);
    });
    
    // 5. VERIFICAR SE HÁ PROBLEMA COM O FILTRO lojaId
    console.log('\n🏪 VERIFICANDO filtro lojaId:');
    
    // Verificar se há movimentações sem lojaId
    const semLojaId = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId IS NULL OR lojaId = ''
    `);
    console.log(`  - Movimentações sem lojaId: ${(semLojaId as any[])[0]?.total}`);
    
    // Verificar se há movimentações com lojaId diferente
    const outrasLojas = await prisma.$queryRawUnsafe(`
      SELECT lojaId, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId IS NOT NULL AND lojaId != ''
      GROUP BY lojaId
      ORDER BY total DESC
    `);
    console.log('  - Movimentações por loja:');
    (outrasLojas as any[]).forEach((l: any, index: number) => {
      console.log(`    ${index + 1}. Loja: '${l.lojaId}' - Total: ${l.total}`);
    });
    
    // 6. VERIFICAR SE HÁ PROBLEMA ESPECÍFICO COM SAIDAS
    console.log('\n🚪 VERIFICANDO problema específico com SAIDAS:');
    
    // Verificar se há SAIDAS em outras lojas
    const saidasOutrasLojas = await prisma.$queryRawUnsafe(`
      SELECT lojaId, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE tipo = 'SAIDA'
      GROUP BY lojaId
      ORDER BY total DESC
    `);
    console.log('  - SAIDAS por loja:');
    (saidasOutrasLojas as any[]).forEach((s: any, index: number) => {
      console.log(`    ${index + 1}. Loja: '${s.lojaId}' - SAIDAS: ${s.total}`);
    });
    
    // 7. CONCLUSÃO
    console.log('\n🎯 CONCLUSÃO:');
    const totalSaidas = (saidaCount as any[])[0]?.total;
    if (totalSaidas > 0) {
      console.log(`  ✅ Existem ${totalSaidas} SAIDAS no banco`);
      console.log(`  ❌ Mas o dashboard está retornando 0`);
      console.log(`  🔍 PROBLEMA: Lógica do dashboard ou cache específico`);
    } else {
      console.log(`  ❌ NÃO existem SAIDAS no banco`);
      console.log(`  🔍 PROBLEMA: Dados não foram inseridos corretamente`);
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
