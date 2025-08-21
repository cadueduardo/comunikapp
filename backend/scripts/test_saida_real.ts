import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const itemId = 'item-1755525457295';
    const lojaId = 'xyjrwbqff';
    const quantidade = 1; // Saída de 1 unidade
    
    console.log(`🧪 Testando saída REAL de ${quantidade} unidade do item: ${itemId}`);
    
    // 1. Verificar estoque ANTES da saída
    console.log('\n📋 ESTOQUE ANTES da saída:');
    const itemAntes = await prisma.$queryRawUnsafe(`
      SELECT quantidadeAtual, estoqueMinimo FROM estoque_itens WHERE id = ?
    `, itemId);
    
    if ((itemAntes as any[]).length === 0) {
      console.log('❌ Item não encontrado');
      return;
    }
    
    const estoqueAntes = Number((itemAntes as any[])[0].quantidadeAtual);
    const estoqueMinimo = Number((itemAntes as any[])[0].estoqueMinimo);
    
    console.log(`  - Quantidade Atual: ${estoqueAntes}`);
    console.log(`  - Estoque Mínimo: ${estoqueMinimo}`);
    console.log(`  - Após saída: ${estoqueAntes - quantidade}`);
    
    // 2. Criar movimentação de saída
    console.log('\n🔄 Criando movimentação de SAIDA...');
    
    const movimentacaoId = `mov-${Date.now()}`;
    const quantidadePosterior = estoqueAntes - quantidade;
    
    // Inserir movimentação
    await prisma.$executeRawUnsafe(`
      INSERT INTO estoque_movimentacoes (
        id, estoqueId, tipo, quantidade, quantidadeAnterior, 
        quantidadePosterior, documentoRef, usuarioId, lojaId, 
        dataMovimentacao, observacoes
      ) VALUES (?, ?, 'SAIDA', ?, ?, ?, 'TESTE-SAIDA-REAL', ?, ?, NOW(), 'Teste de saída real')
    `, movimentacaoId, itemId, quantidade, estoqueAntes, quantidadePosterior, 'sistema', lojaId);
    
    console.log(`✅ Movimentação criada com ID: ${movimentacaoId}`);
    
    // 3. Atualizar quantidade no item
    console.log('\n📝 Atualizando quantidade no item...');
    
    await prisma.$executeRawUnsafe(`
      UPDATE estoque_itens 
      SET quantidadeAtual = ?, dataUltimaMov = NOW()
      WHERE id = ?
    `, quantidadePosterior, itemId);
    
    console.log(`✅ Estoque atualizado para: ${quantidadePosterior}`);
    
    // 4. Verificar estoque DEPOIS da saída
    console.log('\n📋 ESTOQUE DEPOIS da saída:');
    const itemDepois = await prisma.$queryRawUnsafe(`
      SELECT quantidadeAtual, estoqueMinimo FROM estoque_itens WHERE id = ?
    `, itemId);
    
    const estoqueDepois = Number((itemDepois as any[])[0].quantidadeAtual);
    console.log(`  - Quantidade Atual: ${estoqueDepois}`);
    console.log(`  - Estoque Mínimo: ${estoqueMinimo}`);
    
    // 5. Verificar se a movimentação foi criada
    console.log('\n🔍 Verificando movimentação criada:');
    const mov = await prisma.$queryRawUnsafe(`
      SELECT id, tipo, quantidade, quantidadeAnterior, quantidadePosterior, dataMovimentacao
      FROM estoque_movimentacoes 
      WHERE id = ?
    `, movimentacaoId);
    
    if ((mov as any[]).length > 0) {
      const m = (mov as any[])[0];
      console.log(`  - ID: ${m.id}`);
      console.log(`  - Tipo: ${m.tipo}`);
      console.log(`  - Quantidade: ${m.quantidade}`);
      console.log(`  - Anterior: ${m.quantidadeAnterior}`);
      console.log(`  - Posterior: ${m.quantidadePosterior}`);
      console.log(`  - Data: ${m.dataMovimentacao}`);
    } else {
      console.log('❌ Movimentação não encontrada!');
    }
    
    // 6. Verificar se está abaixo do mínimo
    if (quantidadePosterior <= estoqueMinimo) {
      console.log(`\n🚨 ALERTA ATIVADO: Estoque (${quantidadePosterior}) <= Mínimo (${estoqueMinimo})`);
    } else {
      console.log(`\n✅ Estoque OK: ${quantidadePosterior} > ${estoqueMinimo}`);
    }
    
    // 7. Verificar estatísticas atualizadas
    console.log('\n📊 Estatísticas atualizadas:');
    const stats = await prisma.$queryRawUnsafe(`
      SELECT tipo, COUNT(*) as total
      FROM estoque_movimentacoes
      WHERE lojaId = ?
      GROUP BY tipo
    `, lojaId);
    
    (stats as any[]).forEach((stat: any) => {
      console.log(`  - ${stat.tipo}: ${stat.total}`);
    });
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
