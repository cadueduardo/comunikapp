import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🧪 Testando lógica do dashboard para loja: ${lojaId}`);
    
    // Simular exatamente o que o dashboard faz
    console.log('\n📊 Simulando lógica do dashboard:');
    
    // 1. Query que o dashboard usa
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
    
    // 2. Mapeamento que o dashboard usa
    const map: any = { ENTRADA: 0, SAIDA: 0, AJUSTE: 0, TRANSFERENCIA: 0 };
    console.log('\n  Mapeamento inicial:');
    console.log(`    ENTRADA: ${map.ENTRADA}`);
    console.log(`    SAIDA: ${map.SAIDA}`);
    console.log(`    AJUSTE: ${map.AJUSTE}`);
    console.log(`    TRANSFERENCIA: ${map.TRANSFERENCIA}`);
    
    // 3. Loop que o dashboard usa
    console.log('\n  Aplicando resultados:');
    for (const r of statsRows) {
      console.log(`    - Processando: tipo='${r.tipo}', total=${r.total}`);
      map[r.tipo] = Number(r.total || 0);
      console.log(`      → map['${r.tipo}'] = ${map[r.tipo]}`);
    }
    
    // 4. Resultado final
    console.log('\n  Resultado final do mapeamento:');
    console.log(`    ENTRADA: ${map.ENTRADA}`);
    console.log(`    SAIDA: ${map.SAIDA}`);
    console.log(`    AJUSTE: ${map.AJUSTE}`);
    console.log(`    TRANSFERENCIA: ${map.TRANSFERENCIA}`);
    
    // 5. Estatísticas finais (como o dashboard retorna)
    const estatisticas = {
      entradas: map.ENTRADA || 0,
      saidas: map.SAIDA || 0,
      ajustes: map.AJUSTE || 0,
      transferencias: map.TRANSFERENCIA || 0,
    };
    
    console.log('\n  Estatísticas finais:');
    console.log(`    - entradas: ${estatisticas.entradas}`);
    console.log(`    - saidas: ${estatisticas.saias}`);
    console.log(`    - ajustes: ${estatisticas.ajustes}`);
    console.log(`    - transferencias: ${estatisticas.transferencias}`);
    
    // 6. Verificar se está correto
    if (estatisticas.saias === 4) {
      console.log('\n✅ LÓGICA FUNCIONANDO PERFEITAMENTE!');
      console.log('  - Dashboard deve retornar 4 SAÍDAS');
      console.log('  - Frontend receberá o valor correto');
      console.log('  - Card de saídas será preenchido');
    } else {
      console.log('\n❌ Problema na lógica');
      console.log(`  - Esperado: 4 SAÍDAS`);
      console.log(`  - Recebido: ${estatisticas.saias} SAÍDAS`);
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
