import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🔍 VERIFICANDO DADOS REAIS NO BANCO para loja: ${lojaId}`);
    
    // 1. VERIFICAR TODAS AS MOVIMENTAÇÕES EXISTENTES
    console.log('\n📋 TODAS as movimentações no banco:');
    const todasMovimentacoes = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        tipo, 
        quantidade, 
        dataMovimentacao, 
        observacoes,
        lojaId
      FROM estoque_movimentacoes 
      WHERE lojaId = ?
      ORDER BY dataMovimentacao DESC
    `, lojaId);
    
    if ((todasMovimentacoes as any[]).length > 0) {
      (todasMovimentacoes as any[]).forEach((mov: any, index: number) => {
        console.log(`  ${index + 1}. ${mov.tipo} - Qtd: ${mov.quantidade} - Data: ${mov.dataMovimentacao} - Obs: ${mov.observacoes || 'N/A'}`);
      });
    } else {
      console.log('  ❌ NENHUMA movimentação encontrada!');
    }
    
    // 2. VERIFICAR EXATAMENTE O QUE O DASHBOARD ESTÁ FAZENDO
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
    
    // 3. VERIFICAR SE HÁ PROBLEMA COM O TIPO 'SAIDA'
    console.log('\n🚪 VERIFICANDO especificamente o tipo SAIDA:');
    
    // Contar SAIDAS diretamente
    const saidasCount = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'SAIDA'
    `, lojaId);
    
    const totalSaidas = (saidasCount as any[])[0]?.total;
    console.log(`  - Total de SAIDAS no banco: ${totalSaidas}`);
    
    // Verificar se há movimentações com tipo diferente
    const tiposUnicos = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT tipo
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    
    console.log('  - Tipos únicos encontrados:');
    (tiposUnicos as any[]).forEach((t: any, index: number) => {
      console.log(`    ${index + 1}. '${t.tipo}'`);
    });
    
    // 4. VERIFICAR SE HÁ PROBLEMA DE CASE SENSITIVITY
    console.log('\n🔍 VERIFICANDO case sensitivity:');
    
    // Buscar por 'saida' (minúsculo)
    const saidaMinusculo = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'saida'
    `, lojaId);
    
    console.log(`  - Movimentações com tipo 'saida' (minúsculo): ${(saidaMinusculo as any[])[0]?.total}`);
    
    // Buscar por 'Saida' (primeira maiúscula)
    const saidaPrimeiraMaiuscula = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ? AND tipo = 'Saida'
    `, lojaId);
    
    console.log(`  - Movimentações com tipo 'Saida' (primeira maiúscula): ${(saidaPrimeiraMaiuscula as any[])[0]?.total}`);
    
    // 5. VERIFICAR SE HÁ ESPAÇOS OU CARACTERES ESPECIAIS
    console.log('\n🔍 VERIFICANDO caracteres especiais:');
    
    const caracteresEspeciais = await prisma.$queryRawUnsafe(`
      SELECT 
        tipo,
        LENGTH(tipo) as tamanho,
        HEX(tipo) as hex,
        CHAR_LENGTH(tipo) as char_length
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
    `, lojaId);
    
    (caracteresEspeciais as any[]).forEach((c: any, index: number) => {
      console.log(`  ${index + 1}. Tipo: '${c.tipo}' | Tamanho: ${c.tamanho} | Hex: ${c.hex} | Char Length: ${c.char_length}`);
    });
    
    // 6. VERIFICAR SE HÁ PROBLEMA COM A LOJA
    console.log('\n🏪 VERIFICANDO se há problema com a loja:');
    
    const movimentacoesSemLoja = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId IS NULL OR lojaId = ''
    `);
    
    console.log(`  - Movimentações sem lojaId: ${(movimentacoesSemLoja as any[])[0]?.total}`);
    
    // 7. VERIFICAR SE HÁ PROBLEMA COM O FILTRO
    console.log('\n🔍 VERIFICANDO se o filtro está funcionando:');
    
    // Contar todas as movimentações (sem filtro de loja)
    const totalSemFiltro = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
    `);
    
    console.log(`  - Total de movimentações SEM filtro de loja: ${(totalSemFiltro as any[])[0]?.total}`);
    
    // Contar movimentações da loja específica
    const totalComFiltro = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    
    console.log(`  - Total de movimentações COM filtro da loja ${lojaId}: ${(totalComFiltro as any[])[0]?.total}`);
    
    // 8. CONCLUSÃO
    console.log('\n🎯 CONCLUSÃO:');
    if (totalSaidas > 0) {
      console.log(`  ✅ Existem ${totalSaidas} SAIDAS no banco`);
      console.log(`  ❌ Mas o dashboard está retornando 0`);
      console.log(`  🔍 PROBLEMA: Lógica do dashboard ou cache`);
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
