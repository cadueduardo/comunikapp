// ===== CONFIGURADOR AUTOMÁTICO DO BANCO HOSTINGER =====
require('dotenv').config({ path: '.env-catalogo-insumos' });

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function configureHostingerDatabase() {
  console.log('🚀 Configurador Automático do Banco Hostinger\n');
  
  // Verificar se o hostname foi fornecido
  const hostname = process.argv[2];
  if (!hostname) {
    console.log('❌ ERRO: Hostname não fornecido!');
    console.log('\n💡 Uso correto:');
    console.log('   node configure-hostinger-db.js "SEU_HOSTNAME_AQUI"');
    console.log('\n🔍 Para descobrir o hostname:');
    console.log('   1. Acesse o painel da Hostinger');
    console.log('   2. Vá em Sites → Gerenciar → MySQL Remoto');
    console.log('   3. O hostname está na parte superior da seção');
    return;
  }

  console.log(`📋 Configurando banco com hostname: ${hostname}\n`);

  // Configuração da conexão
  const config = {
    host: hostname,
    user: 'u849952347_comunikapp',
    password: 'C@du27140797130622',
    database: 'u849952347_comunikapp',
    port: 3306,
    connectTimeout: 10000
  };

  try {
    console.log('🔄 Testando conexão...');
    
    // Testar conexão
    const connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar se o banco existe
    console.log('🔍 Verificando banco de dados...');
    const [dbRows] = await connection.execute('SHOW DATABASES LIKE ?', [config.database]);
    
    if (dbRows.length === 0) {
      console.log('⚠️  Banco não encontrado, criando...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
      console.log('✅ Banco criado com sucesso!');
    } else {
      console.log('✅ Banco já existe!');
    }
    
    // Selecionar o banco
    await connection.execute(`USE ${config.database}`);
    
    // Verificar tabelas existentes
    console.log('📊 Verificando tabelas existentes...');
    const [tableRows] = await connection.execute('SHOW TABLES');
    console.log(`✅ Tabelas encontradas: ${tableRows.length}`);
    
    if (tableRows.length === 0) {
      console.log('⚠️  Nenhuma tabela encontrada');
      console.log('💡 Execute as migrações Prisma para criar as tabelas');
    } else {
      tableRows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${Object.values(row)[0]}`);
      });
    }
    
    // Fechar conexão
    await connection.end();
    
    // Atualizar arquivo .env
    console.log('\n📝 Atualizando arquivo .env...');
    const envPath = path.join(__dirname, '.env-catalogo-insumos');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Atualizar DATABASE_URL
    const newDatabaseUrl = `CATALOGO_INSUMOS_DATABASE_URL="mysql://u849952347_comunikapp:C@du27140797130622@${hostname}:3306/u849952347_comunikapp"`;
    envContent = envContent.replace(
      /CATALOGO_INSUMOS_DATABASE_URL="[^"]*"/,
      newDatabaseUrl
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Arquivo .env atualizado!');
    
    console.log('\n🎯 Configuração concluída com sucesso!');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute as migrações Prisma');
    console.log('   2. Teste o módulo com banco real');
    console.log('   3. Implemente o crawler');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 ERRO: Conexão recusada');
      console.error('   - Verificar se o hostname está correto');
      console.error('   - Verificar se o IP está liberado na Hostinger');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🚨 ERRO: Acesso negado');
      console.error('   - Verificar usuário e senha');
      console.error('   - Verificar permissões do usuário');
    }
  }
}

// Executar configuração
configureHostingerDatabase().catch(console.error);
