const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário no banco...');
    
    const user = await prisma.usuario.findUnique({
      where: { email: 'clientes.cadueduardo@gmail.com' },
      include: { loja: true }
    });
    
    if (user) {
      console.log('✅ Usuário encontrado:');
      console.log('ID:', user.id);
      console.log('Nome:', user.nome_completo);
      console.log('Email:', user.email);
      console.log('Função:', user.funcao);
      console.log('Status:', user.status);
      console.log('Loja ID:', user.loja_id);
      console.log('Loja Nome:', user.loja?.nome);
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
    // Verificar todas as lojas
    const lojas = await prisma.loja.findMany();
    console.log('\n🏪 Lojas no banco:');
    lojas.forEach(loja => {
      console.log(`- ${loja.nome} (${loja.id})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();

