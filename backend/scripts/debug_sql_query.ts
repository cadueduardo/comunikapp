import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🔍 Debugando query SQL para loja: ${lojaId}`);
    
    // 1. Query simples para ver os tipos
    console.log('\n📋 Tipos de movimentações encontrados:');
    const tipos = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT tipo
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      ORDER BY tipo
    `, lojaId);
    
    (tipos as any[]).forEach((t: any, index: number) => {
      console.log(`  ${index + 1}. '${t.tipo}'`);
    });
    
    // 2. Query com CASE WHEN para cada tipo individualmente
    console.log('\n🧪 Testando CASE WHEN para cada tipo:');
    
    const entradaQuery = await prisma.$queryRawUnsafe(`
      SELECT COUNT(CASE WHEN tipo = 'ENTRADA' THEN 1 END) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    console.log(`  - ENTRADA: ${(entradaQuery as any[])[0]?.total}`);
    
    const saidaQuery = await prisma.$queryRawUnsafe(`
      SELECT COUNT(CASE WHEN tipo = 'SAIDA' THEN 1 END) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    console.log(`  - SAIDA: ${(saidaQuery as any[])[0]?.total}`);
    
    const ajusteQuery = await prisma.$queryRawUnsafe(`
      SELECT COUNT(CASE WHEN tipo = 'AJUSTE' THEN 1 END) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    console.log(`  - AJUSTE: ${(ajusteQuery as any[])[0]?.total}`);
    
    const transferenciaQuery = await prisma.$queryRawUnsafe(`
      SELECT COUNT(CASE WHEN tipo = 'TRANSFERENCIA' THEN 1 END) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    console.log(`  - TRANSFERENCIA: ${(transferenciaQuery as any[])[0]?.total}`);
    
    // 3. Query completa com alias
    console.log('\n🔍 Query completa com alias:');
    const queryCompleta = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(CASE WHEN tipo = 'ENTRADA' THEN 1 END) as entradas,
        COUNT(CASE WHEN tipo = 'SAIDA' THEN 1 END) as saidas,
        COUNT(CASE WHEN tipo = 'AJUSTE' THEN 1 END) as ajustes,
        COUNT(CASE WHEN tipo = 'TRANSFERENCIA' THEN 1 END) as transferencias
      FROM estoque_movimentacoes
      WHERE lojaId = ?
    `, lojaId);
    
    const resultado = (queryCompleta as any[])[0];
    console.log('  Resultado completo:');
    console.log(`    - entradas: ${resultado?.entradas} (tipo: ${typeof resultado?.entradas})`);
    console.log(`    - saidas: ${resultado?.saidas} (tipo: ${typeof resultado?.saidas})`);
    console.log(`    - ajustes: ${resultado?.ajustes} (tipo: ${typeof resultado?.ajustes})`);
    console.log(`    - transferencias: ${resultado?.transferencias} (tipo: ${typeof resultado?.transferencias})`);
    
    // 4. Verificar se há problemas com espaços ou caracteres especiais
    console.log('\n🔍 Verificando caracteres especiais:');
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
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
