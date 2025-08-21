import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🧪 Simulando processo de autenticação do frontend...');
    
    // 1. Verificar se existe uma loja para teste
    console.log('\n📋 Verificando lojas disponíveis:');
    const lojas = await prisma.$queryRawUnsafe(`
      SELECT id, nome, email, ativo
      FROM lojas
      LIMIT 5
    `);
    
    if ((lojas as any[]).length > 0) {
      (lojas as any[]).forEach((loja: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${loja.id} | Nome: ${loja.nome} | Email: ${loja.email} | Ativo: ${loja.ativo}`);
      });
    } else {
      console.log('  ❌ Nenhuma loja encontrada');
      return;
    }
    
    // 2. Verificar se existe um usuário para teste
    console.log('\n👤 Verificando usuários disponíveis:');
    const usuarios = await prisma.$queryRawUnsafe(`
      SELECT id, nome, email, ativo
      FROM usuarios
      LIMIT 5
    `);
    
    if ((usuarios as any[]).length > 0) {
      (usuarios as any[]).forEach((usuario: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${usuario.id} | Nome: ${usuario.nome} | Email: ${usuario.email} | Ativo: ${usuario.ativo}`);
      });
    } else {
      console.log('  ❌ Nenhum usuário encontrado');
    }
    
    // 3. Verificar se há tokens válidos
    console.log('\n🔑 Verificando tokens válidos:');
    const tokens = await prisma.$queryRawUnsafe(`
      SELECT id, token, usuarioId, lojaId, expiraEm, ativo
      FROM tokens_acesso
      WHERE ativo = 1 AND expiraEm > NOW()
      LIMIT 5
    `);
    
    if ((tokens as any[]).length > 0) {
      (tokens as any[]).forEach((token: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${token.id} | Usuario: ${token.usuarioId} | Loja: ${token.lojaId} | Expira: ${token.expiraEm}`);
      });
    } else {
      console.log('  ❌ Nenhum token válido encontrado');
    }
    
    // 4. Verificar se a loja xyjrwbqff existe e está ativa
    console.log('\n🏪 Verificando loja específica (xyjrwbqff):');
    const lojaEspecifica = await prisma.$queryRawUnsafe(`
      SELECT id, nome, email, ativo
      FROM lojas
      WHERE id = ?
    `, 'xyjrwbqff');
    
    if ((lojaEspecifica as any[]).length > 0) {
      const loja = (lojaEspecifica as any[])[0];
      console.log(`  ✅ Loja encontrada: ${loja.nome} | Ativo: ${loja.ativo}`);
      
      if (loja.ativo === 0) {
        console.log('  ⚠️ ATENÇÃO: Loja está INATIVA!');
      }
    } else {
      console.log('  ❌ Loja xyjrwbqff NÃO encontrada!');
    }
    
    // 5. Verificar se há usuários associados à loja
    console.log('\n👥 Verificando usuários da loja:');
    const usuariosLoja = await prisma.$queryRawUnsafe(`
      SELECT id, nome, email, ativo
      FROM usuarios
      WHERE lojaId = ?
      LIMIT 5
    `, 'xyjrwbqff');
    
    if ((usuariosLoja as any[]).length > 0) {
      (usuariosLoja as any[]).forEach((usuario: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${usuario.id} | Nome: ${usuario.nome} | Email: ${usuario.email} | Ativo: ${usuario.ativo}`);
      });
    } else {
      console.log('  ❌ Nenhum usuário encontrado para a loja xyjrwbqff');
    }
    
  } catch (e: any) {
    console.error('❌ Erro:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
