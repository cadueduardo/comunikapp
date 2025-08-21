import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const email = 'clientes.cadueduardo@gmail.com';
    console.log(`🔍 Verificando usuário: ${email}`);
    
    // Verificar dados do usuário
    const usuario = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        email, 
        nome_completo, 
        status, 
        email_verificado,
        codigo_verificacao_email,
        codigo_verificacao_email_expiracao,
        criado_em
      FROM usuario
      WHERE email = ?
    `, email);
    
    if ((usuario as any[]).length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    const u = (usuario as any[])[0];
    console.log('\n📋 Dados do usuário:');
    console.log(`  - ID: ${u.id}`);
    console.log(`  - Nome: ${u.nome_completo}`);
    console.log(`  - Status: ${u.status}`);
    console.log(`  - Email verificado: ${u.email_verificado}`);
    console.log(`  - Criado em: ${u.criado_em}`);
    
    if (u.codigo_verificacao_email) {
      console.log(`  - Código de verificação: ${u.codigo_verificacao_email}`);
      console.log(`  - Expira em: ${u.codigo_verificacao_email_expiracao}`);
      
      // Verificar se o código ainda é válido
      const agora = new Date();
      const expiracao = new Date(u.codigo_verificacao_email_expiracao);
      
      if (agora < expiracao) {
        console.log(`  ✅ Código ainda válido (expira em ${expiracao.toLocaleString()})`);
      } else {
        console.log(`  ❌ Código expirado (expirou em ${expiracao.toLocaleString()})`);
      }
    } else {
      console.log(`  - Código de verificação: NÃO DEFINIDO`);
    }
    
    // Verificar se o usuário precisa definir senha
    if (u.status === 'PENDENTE_VERIFICACAO') {
      console.log('\n⚠️ Usuário precisa definir senha inicial');
      console.log('  - Status: PENDENTE_VERIFICACAO');
      console.log('  - Email não verificado');
      
      if (u.codigo_verificacao_email) {
        console.log('\n💡 Para definir senha:');
        console.log(`  POST /usuarios/definir-senha`);
        console.log(`  Body: {`);
        console.log(`    "email": "${u.email}",`);
        console.log(`    "codigo": "${u.codigo_verificacao_email}",`);
        console.log(`    "senha": "nova_senha_aqui"`);
        console.log(`  }`);
      } else {
        console.log('\n❌ Código de verificação não encontrado');
        console.log('  - Usuário precisa de um novo código');
      }
    } else if (u.status === 'ATIVO' && u.email_verificado === 1) {
      console.log('\n✅ Usuário ativo e verificado');
      console.log('  - Pode fazer login normalmente');
      console.log('  - Senha já foi definida');
      
      console.log('\n💡 Para resetar senha:');
      console.log('  - Usar rota de recuperação de senha');
      console.log('  - Ou alterar diretamente no banco (não recomendado)');
    }
    
    // Verificar se há outros usuários para a mesma loja
    console.log('\n👥 Outros usuários da loja xyjrwbqff:');
    const outrosUsuarios = await prisma.$queryRawUnsafe(`
      SELECT 
        email, 
        nome_completo, 
        status, 
        email_verificado,
        funcao
      FROM usuario
      WHERE loja_id = 'xyjrwbqff' AND email != ?
      ORDER BY status, email_verificado
    `, email);
    
    if ((outrosUsuarios as any[]).length > 0) {
      (outrosUsuarios as any[]).forEach((u: any, index: number) => {
        console.log(`  ${index + 1}. ${u.nome_completo} (${u.email})`);
        console.log(`     - Status: ${u.status}`);
        console.log(`     - Email verificado: ${u.email_verificado}`);
        console.log(`     - Função: ${u.funcao}`);
      });
    } else {
      console.log('  - Nenhum outro usuário encontrado');
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
