const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Criar uma loja de teste
    const loja = await prisma.loja.create({
      data: {
        nome: 'Loja Teste',
        email: 'teste@loja.com',
        telefone: '(11) 99999-9999',
        cpf: '123.456.789-00',
        status: 'ATIVO',
        data_inicio_trial: new Date(),
        trial_restante_dias: 30,
      },
    });

    console.log('✅ Loja criada:', loja.id);

    // Criar hash da senha
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Criar um usuário de teste
    const usuario = await prisma.usuario.create({
      data: {
        nome_completo: 'Administrador Teste',
        email: 'admin@teste.com',
        senha: hashedPassword,
        telefone: '(11) 99999-9999',
        funcao: 'ADMINISTRADOR',
        status: 'ATIVO',
        email_verificado: true,
        loja_id: loja.id,
      },
    });

    console.log('✅ Usuário criado:', usuario.email);
    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de teste:');
    console.log('Email: admin@teste.com');
    console.log('Senha: 123456');

  } catch (error) {
    console.error('❌ Erro no seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed(); 