import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const itemId = 'item-1755525457295';
    const lojaId = 'xyjrwbqff';
    const localizacaoOrigemId = 'loc-1755525040235'; // Localização atual do item
    const localizacaoDestinoId = 'loc-1755528189698'; // Nova localização de destino
    const quantidade = 1;
    
    console.log(`🧪 Testando transferência corrigida para item: ${itemId}`);
    console.log(`📍 De: ${localizacaoOrigemId} → Para: ${localizacaoDestinoId}`);
    
    // 1. Verificar estoque ANTES da transferência
    console.log('\n📋 ESTOQUE ANTES da transferência:');
    const itemAntes = await prisma.$queryRawUnsafe(`
      SELECT quantidadeAtual, localizacaoId FROM estoque_itens WHERE id = ?
    `, itemId);
    
    if ((itemAntes as any[]).length === 0) {
      console.log('❌ Item não encontrado');
      return;
    }
    
    const estoqueAntes = Number((itemAntes as any[])[0].quantidadeAtual);
    const localizacaoAtual = (itemAntes as any[])[0].localizacaoId;
    
    console.log(`  - Quantidade Atual: ${estoqueAntes}`);
    console.log(`  - Localização Atual: ${localizacaoAtual}`);
    
    // 2. Criar movimentação de TRANSFERENCIA (SAIDA)
    console.log('\n🔄 Criando movimentação de TRANSFERENCIA (SAIDA)...');
    
    const movimentacaoSaidaId = `mov-${Date.now()}-saida`;
    const quantidadePosterior = estoqueAntes - quantidade;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO estoque_movimentacoes (
        id, estoqueId, tipo, quantidade, quantidadeAnterior, 
        quantidadePosterior, documentoRef, usuarioId, lojaId, 
        dataMovimentacao, observacoes
      ) VALUES (?, ?, 'TRANSFERENCIA', ?, ?, ?, 'TESTE-TRANSFERENCIA', ?, ?, NOW(), 'Transferência para nova localização')
    `, movimentacaoSaidaId, itemId, quantidade, estoqueAntes, quantidadePosterior, 'sistema', lojaId);
    
    console.log(`✅ Movimentação de SAIDA criada com ID: ${movimentacaoSaidaId}`);
    
    // 3. Atualizar localização do item
    console.log('\n📝 Atualizando localização do item...');
    
    await prisma.$executeRawUnsafe(`
      UPDATE estoque_itens 
      SET localizacaoId = ?, dataUltimaMov = NOW()
      WHERE id = ?
    `, localizacaoDestinoId, itemId);
    
    console.log(`✅ Localização atualizada para: ${localizacaoDestinoId}`);
    
    // 4. Criar movimentação de TRANSFERENCIA (ENTRADA)
    console.log('\n🔄 Criando movimentação de TRANSFERENCIA (ENTRADA)...');
    
    const movimentacaoEntradaId = `mov-${Date.now()}-entrada`;
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO estoque_movimentacoes (
        id, estoqueId, tipo, quantidade, quantidadeAnterior, 
        quantidadePosterior, documentoRef, usuarioId, lojaId, 
        dataMovimentacao, observacoes
      ) VALUES (?, ?, 'TRANSFERENCIA', ?, ?, ?, 'TESTE-TRANSFERENCIA', ?, ?, NOW(), 'Transferência recebida')
    `, movimentacaoEntradaId, itemId, quantidade, 0, quantidade, 'sistema', lojaId);
    
    console.log(`✅ Movimentação de ENTRADA criada com ID: ${movimentacaoEntradaId}`);
    
    // 5. Registrar na tabela de transferências
    console.log('\n📋 Registrando na tabela de transferências...');
    
    const transferenciaId = `transf-${Date.now()}`;
    await prisma.$executeRawUnsafe(`
      INSERT INTO estoque_transferencias (
        id, estoqueId, localizacaoOrigemId, localizacaoDestinoId, quantidade, 
        observacoes, status, usuarioId, lojaId, dataTransferencia
      ) VALUES (?, ?, ?, ?, ?, 'Teste de transferência corrigida', 'CONCLUIDA', ?, ?, NOW())
    `, transferenciaId, itemId, localizacaoOrigemId, localizacaoDestinoId, quantidade, 'sistema', lojaId);
    
    console.log(`✅ Transferência registrada com ID: ${transferenciaId}`);
    
    // 6. Verificar estatísticas atualizadas
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
    
    // 7. Verificar se as movimentações foram criadas
    console.log('\n🔍 Verificando movimentações criadas:');
    const movs = await prisma.$queryRawUnsafe(`
      SELECT id, tipo, quantidade, dataMovimentacao, observacoes
      FROM estoque_movimentacoes
      WHERE id IN (?, ?)
      ORDER BY dataMovimentacao
    `, movimentacaoSaidaId, movimentacaoEntradaId);
    
    (movs as any[]).forEach((mov: any, index: number) => {
      console.log(`  ${index + 1}. ${mov.tipo} - ${mov.quantidade} - ${mov.dataMovimentacao}`);
    });
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
