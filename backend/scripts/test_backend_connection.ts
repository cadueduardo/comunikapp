import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🧪 Testando conexão com o backend...');
    
    // Testar se o Prisma está funcionando
    console.log('📊 Testando conexão com o banco...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão com banco OK:', result);
    
    // Testar se as tabelas estão acessíveis
    console.log('\n📋 Testando acesso às tabelas...');
    
    const localizacoes = await prisma.$queryRaw`SELECT COUNT(*) as total FROM estoque_localizacoes`;
    console.log('✅ Tabela estoque_localizacoes acessível:', localizacoes);
    
    const itens = await prisma.$queryRaw`SELECT COUNT(*) as total FROM estoque_itens`;
    console.log('✅ Tabela estoque_itens acessível:', itens);
    
    const movimentacoes = await prisma.$queryRaw`SELECT COUNT(*) as total FROM estoque_movimentacoes`;
    console.log('✅ Tabela estoque_movimentacoes acessível:', movimentacoes);
    
    console.log('\n🎯 Backend funcionando perfeitamente!');
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
