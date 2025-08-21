import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function run() {
  try {
    const email = 'clientes.cadueduardo@gmail.com';
    console.log(`🔍 Verificando usuário: ${email}`);
    
    // Buscar usuário no banco
    const usuario = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        email, 
        nome_completo, 
        status, 
        email_verificado, 
        senha,
        funcao,
        loja_id
      FROM usuario 
      WHERE email = ?
    `, email);
    
    if ((usuario as any[]).length === 0) {
      console.log('❌ Usuário não encontrado no banco');
      return;
    }
    
    const user = (usuario as any[])[0];
    console.log('\n📋 Dados do usuário:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Nome: ${user.nome_completo}`);
    console.log(`  - Status: ${user.status}`);
    console.log(`  - Email verificado: ${user.email_verificado}`);
    console.log(`  - Função: ${user.funcao}`);
    console.log(`  - Loja ID: ${user.loja_id}`);
    console.log(`  - Senha hash: ${user.senha ? '✅ Definida' : '❌ Não definida'}`);
    
    if (user.senha) {
      console.log(`  - Hash da senha: ${user.senha.substring(0, 20)}...`);
      
      // Testar senha 'teste123'
      const senhaTeste = 'teste123';
      const senhaCorreta = await bcrypt.compare(senhaTeste, user.senha);
      console.log(`\n🧪 Testando senha '${senhaTeste}': ${senhaCorreta ? '✅ CORRETA' : '❌ INCORRETA'}`);
      
      if (!senhaCorreta) {
        console.log('\n💡 Possíveis senhas para testar:');
        const senhasComuns = ['123456', 'password', 'admin', '123123', 'qwerty', '123456789'];
        for (const senha of senhasComuns) {
          const resultado = await bcrypt.compare(senha, user.senha);
          if (resultado) {
            console.log(`  ✅ '${senha}' - CORRETA!`);
            break;
          }
        }
      }
    }
    
    // Verificar loja
    console.log('\n🏪 Verificando loja:');
    const loja = await prisma.$queryRawUnsafe(`
      SELECT id, nome, email, status
      FROM loja 
      WHERE id = ?
    `, user.loja_id);
    
    if ((loja as any[]).length > 0) {
      const l = (loja as any[])[0];
      console.log(`  - ID: ${l.id}`);
      console.log(`  - Nome: ${l.nome}`);
      console.log(`  - Email: ${l.email}`);
      console.log(`  - Status: ${l.status}`);
    } else {
      console.log('  ❌ Loja não encontrada');
    }
    
    // Verificar se há outros usuários na mesma loja
    console.log('\n👥 Outros usuários na mesma loja:');
    const outrosUsuarios = await prisma.$queryRawUnsafe(`
      SELECT email, nome_completo, status, email_verificado
      FROM usuario 
      WHERE loja_id = ? AND email != ?
      ORDER BY status, email_verificado
    `, user.loja_id, email);
    
    if ((outrosUsuarios as any[]).length > 0) {
      (outrosUsuarios as any[]).forEach((u: any, index: number) => {
        console.log(`  ${index + 1}. ${u.nome_completo} (${u.email})`);
        console.log(`     - Status: ${u.status}`);
        console.log(`     - Email verificado: ${u.email_verificado}`);
      });
    } else {
      console.log('  - Nenhum outro usuário encontrado');
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
