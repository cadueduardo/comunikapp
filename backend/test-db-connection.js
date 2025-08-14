const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testando conexão com o banco...');
    
    // Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso');
    
    // Testar query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de teste executada:', result);
    
    // Testar se as tabelas do estoque existem
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'comunikapp' 
      AND TABLE_NAME LIKE '%estoque%'
    `;
    console.log('📋 Tabelas de estoque encontradas:', tables);
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();


