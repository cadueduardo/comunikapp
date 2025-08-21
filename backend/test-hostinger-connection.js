// ===== TESTE DE CONEXÃO COM BANCO HOSTINGER =====
require('dotenv').config({ path: '.env-catalogo-insumos' });

const mysql = require('mysql2/promise');

async function testHostingerConnection(hostname = null) {
  console.log('🔍 Testando conexão com banco MySQL da Hostinger...\n');
  
  // Configuração da conexão
  const config = {
    host: hostname || 'srv802.hstgr.io',
    user: 'u849952347_comunikapp',
    password: 'C@du27140797130622',
    database: 'u849952347_comunikapp',
    port: 3306,
    connectTimeout: 10000
  };

  console.log('📋 Configuração de conexão:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Port: ${config.port}\n`);

  console.log('💡 DICA: Se o hostname estiver errado, execute:');
  console.log(`   node test-hostinger-connection.js "SEU_HOSTNAME_AQUI"\n`);

  // Testar credenciais alternativas se a primeira falhar
  console.log('🧪 Testando credenciais alternativas...');
  
  const alternativeCredentials = [
    { user: 'u849952347_comunikapp', password: 'Cadu27140797130622', desc: 'Sem @ na senha' },
    { user: 'u849952347_comunikapp', password: 'C@du27140797130622', desc: 'Com @ na senha' }
  ];

  for (const cred of alternativeCredentials) {
    console.log(`   Testando: ${cred.desc}`);
    try {
      const testConfig = { ...config, user: cred.user, password: cred.password };
      const testConnection = await mysql.createConnection(testConfig);
      console.log(`   ✅ CREDENCIAIS FUNCIONARAM: ${cred.desc}`);
      await testConnection.end();
      // Atualizar config principal
      config.user = cred.user;
      config.password = cred.password;
      break;
    } catch (testError) {
      console.log(`   ❌ Falhou: ${testError.message}`);
    }
  }

  try {
    console.log('🔄 Tentando conectar...');
    
    // Tentar conexão
    const connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar query simples
    console.log('🧪 Testando query SELECT...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Query executada com sucesso:', rows[0]);
    
    // Verificar versão do MySQL
    console.log('🔍 Verificando versão do MySQL...');
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    console.log('✅ Versão MySQL:', versionRows[0].version);
    
    // Verificar tabelas existentes
    console.log('📊 Verificando tabelas existentes...');
    const [tableRows] = await connection.execute('SHOW TABLES');
    console.log('✅ Tabelas encontradas:', tableRows.length);
    if (tableRows.length > 0) {
      tableRows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${Object.values(row)[0]}`);
      });
    }
    
    // Fechar conexão
    await connection.end();
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('🎯 Banco Hostinger está funcionando perfeitamente!');
    
    // Mostrar string de conexão correta
    console.log('\n📋 String de conexão correta para .env:');
    console.log(`CATALOGO_INSUMOS_DATABASE_URL="mysql://u849952347_comunikapp:C@du27140797130622@${config.host}:3306/u849952347_comunikapp"`);
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('\n🔍 Possíveis soluções:');
    console.error('   1. Verificar se o IP está liberado na Hostinger');
    console.error('   2. Verificar se as credenciais estão corretas');
    console.error('   3. Verificar se o banco existe');
    console.error('   4. Verificar se o usuário tem permissões');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🚨 ERRO: Conexão recusada');
      console.error('   - Verificar se o hostname está correto');
      console.error('   - Verificar se a porta 3306 está aberta');
      console.error('   - O hostname deve ser o servidor MySQL da Hostinger, não localhost');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n🚨 ERRO: Acesso negado');
      console.error('   - Verificar usuário e senha');
      console.error('   - Verificar permissões do usuário');
    }
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n🚨 ERRO: Banco não encontrado');
      console.error('   - Verificar se o banco existe');
      console.error('   - Verificar nome do banco');
    }
    
    console.error('\n💡 Para descobrir o hostname correto:');
    console.error('   1. Acesse o painel da Hostinger');
    console.error('   2. Vá em Sites → Gerenciar → MySQL Remoto');
    console.error('   3. O hostname está na parte superior da seção');
    console.error('   4. Execute: node test-hostinger-connection.js "HOSTNAME_CORRETO"');
  }
}

// Executar teste
const hostname = process.argv[2];
testHostingerConnection(hostname).catch(console.error);
