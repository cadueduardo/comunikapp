import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const itemId = 'item-1755525457295';
    const lojaId = 'xyjrwbqff';
    const quantidade = 3; // Vai deixar estoque em 2 (abaixo do mínimo 3)
    
    console.log(`🧪 Testando saída de ${quantidade} unidades do item: ${itemId}`);
    
    // Verificar estoque atual
    const itemAtual = await prisma.$queryRawUnsafe(`
      SELECT quantidadeAtual, estoqueMinimo FROM estoque_itens WHERE id = ?
    `, itemId);
    
    if ((itemAtual as any[]).length === 0) {
      console.log('❌ Item não encontrado');
      return;
    }
    
    const estoqueAtual = Number((itemAtual as any[])[0].quantidadeAtual);
    const estoqueMinimo = Number((itemAtual as any[])[0].estoqueMinimo);
    
    console.log(`📋 Estoque atual: ${estoqueAtual}`);
    console.log(`📋 Estoque mínimo: ${estoqueMinimo}`);
    console.log(`📋 Após saída: ${estoqueAtual - quantidade}`);
    
    if (estoqueAtual - quantidade < estoqueMinimo) {
      console.log(`⚠️ ALERTA: Após saída, estoque ficará abaixo do mínimo!`);
    }
    
    // Criar movimentação de saída
    const movimentacaoId = `mov-${Date.now()}`;
    const quantidadePosterior = estoqueAtual - quantidade;
    
    console.log(`\n🔄 Criando movimentação de SAIDA...`);
    
    // Inserir movimentação
    await prisma.$executeRawUnsafe(`
      INSERT INTO estoque_movimentacoes (
        id, estoqueId, tipo, quantidade, quantidadeAnterior, 
        quantidadePosterior, documentoRef, usuarioId, lojaId, 
        dataMovimentacao, observacoes
      ) VALUES (?, ?, 'SAIDA', ?, ?, ?, 'TESTE-ALERTA', ?, ?, NOW(), 'Teste para gerar alerta de estoque baixo')
    `, movimentacaoId, itemId, quantidade, estoqueAtual, quantidadePosterior, 'sistema', lojaId);
    
    // Atualizar quantidade no item
    await prisma.$executeRawUnsafe(`
      UPDATE estoque_itens 
      SET quantidadeAtual = ?, dataUltimaMov = NOW()
      WHERE id = ?
    `, quantidadePosterior, itemId);
    
    console.log(`✅ Movimentação criada com sucesso!`);
    console.log(`✅ Estoque atualizado para: ${quantidadePosterior}`);
    
    // Verificar se agora está abaixo do mínimo
    if (quantidadePosterior <= estoqueMinimo) {
      console.log(`\n🚨 ALERTA ATIVADO: Estoque (${quantidadePosterior}) <= Mínimo (${estoqueMinimo})`);
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
