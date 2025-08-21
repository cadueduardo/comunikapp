import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🧪 Teste simples de mapeamento para loja: ${lojaId}`);
    
    // 1. Dados do banco
    const statsRows: any[] = await prisma.$queryRawUnsafe(`
      SELECT tipo, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
    `, lojaId);
    
    console.log('\n📊 Dados do banco:');
    (statsRows as any[]).forEach((r: any, index: number) => {
      console.log(`  ${index + 1}. ${r.tipo}: ${r.total}`);
    });
    
    // 2. Mapeamento simples
    const map: any = { ENTRADA: 0, SAIDA: 0, AJUSTE: 0, TRANSFERENCIA: 0 };
    
    console.log('\n🔍 Mapeamento passo a passo:');
    for (const r of statsRows) {
      console.log(`  - Antes: map['${r.tipo}'] = ${map[r.tipo]}`);
      map[r.tipo] = Number(r.total);
      console.log(`  - Depois: map['${r.tipo}'] = ${map[r.tipo]}`);
    }
    
    // 3. Verificar valores finais
    console.log('\n📋 Valores finais do map:');
    console.log(`  - map.ENTRADA = ${map.ENTRADA}`);
    console.log(`  - map.SAIDA = ${map.SAIDA}`);
    console.log(`  - map.AJUSTE = ${map.AJUSTE}`);
    console.log(`  - map.TRANSFERENCIA = ${map.TRANSFERENCIA}`);
    
    // 4. Criar objeto de estatísticas
    console.log('\n🏗️ Criando objeto de estatísticas:');
    const estatisticas = {
      entradas: map.ENTRADA,
      saidas: map.SAIDA,
      ajustes: map.AJUSTE,
      transferencias: map.TRANSFERENCIA,
    };
    
    console.log('  Objeto criado:');
    console.log(`    - entradas: ${estatisticas.entradas}`);
    console.log(`    - saidas: ${estatisticas.saias}`);
    console.log(`    - ajustes: ${estatisticas.ajustes}`);
    console.log(`    - transferencias: ${estatisticas.transferencias}`);
    
    // 5. Verificar tipos
    console.log('\n🔍 Verificando tipos:');
    console.log(`  - typeof map.SAIDA: ${typeof map.SAIDA}`);
    console.log(`  - typeof estatisticas.saias: ${typeof estatisticas.saias}`);
    console.log(`  - map.SAIDA === 4: ${map.SAIDA === 4}`);
    console.log(`  - estatisticas.saias === 4: ${estatisticas.saias === 4}`);
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
