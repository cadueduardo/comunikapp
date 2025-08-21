import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🧪 Testando sistema de login...');
    
    // 1. Verificar usuários disponíveis
    console.log('\n👤 Usuários disponíveis:');
    const usuarios = await prisma.$queryRawUnsafe(`
      SELECT id, email, nome_completo, status, email_verificado, funcao, loja_id
      FROM usuario
      LIMIT 5
    `);
    
    if ((usuarios as any[]).length > 0) {
      (usuarios as any[]).forEach((u: any, index: number) => {
        console.log(`  ${index + 1}. ${u.nome_completo} (${u.email})`);
        console.log(`     - Status: ${u.status}`);
        console.log(`     - Email verificado: ${u.email_verificado}`);
        console.log(`     - Função: ${u.funcao}`);
        console.log(`     - Loja ID: ${u.loja_id}`);
      });
    } else {
      console.log('  ❌ Nenhum usuário encontrado');
      return;
    }
    
    // 2. Verificar lojas disponíveis
    console.log('\n🏪 Lojas disponíveis:');
    const lojas = await prisma.$queryRawUnsafe(`
      SELECT id, nome, email, status
      FROM loja
      LIMIT 5
    `);
    
    if ((lojas as any[]).length > 0) {
      (lojas as any[]).forEach((l: any, index: number) => {
        console.log(`  ${index + 1}. ${l.nome} (${l.email}) - Status: ${l.status}`);
      });
    } else {
      console.log('  ❌ Nenhuma loja encontrada');
      return;
    }
    
    // 3. Verificar se há usuários ativos e com email verificado
    console.log('\n✅ Usuários aptos para login:');
    const usuariosAtivos = await prisma.$queryRawUnsafe(`
      SELECT id, email, nome_completo, status, email_verificado
      FROM usuario
      WHERE status = 'ATIVO' AND email_verificado = 1
      LIMIT 5
    `);
    
    if ((usuariosAtivos as any[]).length > 0) {
      (usuariosAtivos as any[]).forEach((u: any, index: number) => {
        console.log(`  ${index + 1}. ${u.nome_completo} (${u.email}) - ✅ ATIVO e VERIFICADO`);
      });
    } else {
      console.log('  ❌ Nenhum usuário ativo e verificado encontrado');
      console.log('  ⚠️ Usuários precisam estar ATIVO e com email_verificado = 1');
    }
    
    // 4. Verificar se há usuários para a loja xyjrwbqff
    console.log('\n🎯 Usuários para loja xyjrwbqff:');
    const usuariosLoja = await prisma.$queryRawUnsafe(`
      SELECT id, email, nome_completo, status, email_verificado, funcao
      FROM usuario
      WHERE loja_id = ?
    `, 'xyjrwbqff');
    
    if ((usuariosLoja as any[]).length > 0) {
      (usuariosLoja as any[]).forEach((u: any, index: number) => {
        console.log(`  ${index + 1}. ${u.nome_completo} (${u.email})`);
        console.log(`     - Status: ${u.status}`);
        console.log(`     - Email verificado: ${u.email_verificado}`);
        console.log(`     - Função: ${u.funcao}`);
        
        if (u.status === 'ATIVO' && u.email_verificado === 1) {
          console.log(`     ✅ APTO para login`);
        } else {
          console.log(`     ❌ NÃO APTO para login`);
          if (u.status !== 'ATIVO') console.log(`        - Status deve ser ATIVO`);
          if (u.email_verificado !== 1) console.log(`        - Email deve estar verificado`);
        }
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
