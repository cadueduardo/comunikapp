import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const lojaId = 'xyjrwbqff';
    console.log(`🔍 Verificando localizações para loja: ${lojaId}`);
    
    // Verificar localizações
    const localizacoes = await prisma.$queryRawUnsafe(`
      SELECT id, codigo, descricao, ativo
      FROM estoque_localizacoes
      WHERE lojaId = ?
      ORDER BY codigo
    `, lojaId);
    
    if ((localizacoes as any[]).length > 0) {
      console.log('\n📍 Localizações disponíveis:');
      (localizacoes as any[]).forEach((loc: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${loc.id} | Código: ${loc.codigo} | Descrição: ${loc.descricao} | Ativo: ${loc.ativo}`);
      });
    } else {
      console.log('❌ Nenhuma localização encontrada');
    }
    
    // Verificar localização atual do item
    const itemId = 'item-1755525457295';
    const item = await prisma.$queryRawUnsafe(`
      SELECT id, codigo, nome, localizacaoId, quantidadeAtual
      FROM estoque_itens
      WHERE id = ?
    `, itemId);
    
    if ((item as any[]).length > 0) {
      const i = (item as any[])[0];
      console.log(`\n📦 Item: ${i.nome}`);
      console.log(`  - Código: ${i.codigo}`);
      console.log(`  - Localização Atual: ${i.localizacaoId}`);
      console.log(`  - Quantidade: ${i.quantidadeAtual}`);
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
