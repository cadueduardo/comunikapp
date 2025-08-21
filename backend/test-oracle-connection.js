const mysql = require('mysql2/promise');

// Configuração de conexão (ajuste conforme necessário)
const config = {
  host: 'seu-ip-oracle', // Substitua pelo IP da sua máquina Oracle
  port: 3306,
  user: 'comunikapp',
  password: 'ComunikApp2025!',
  database: 'comunikapp',
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
  reconnect: true
};

async function testConnection() {
  console.log('🔌 Testando conexão com MySQL da Oracle Cloud...');
  console.log('==============================================');
  
  try {
    // Testar conexão
    console.log('📡 Conectando...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar query simples
    console.log('🔍 Testando query...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    console.log('✅ Query executada:', rows[0]);
    
    // Verificar versão do MySQL
    const [version] = await connection.execute('SELECT VERSION() as version');
    console.log('✅ Versão MySQL:', version[0].version);
    
    // Verificar banco de dados
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('✅ Bancos disponíveis:', databases.map(db => db.Database));
    
    // Verificar usuário atual
    const [user] = await connection.execute('SELECT USER() as current_user');
    console.log('✅ Usuário atual:', user[0].current_user);
    
    await connection.end();
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.log('');
    console.log('🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verifique se o IP está correto');
    console.log('2. Verifique se a porta 3306 está aberta no firewall');
    console.log('3. Verifique se o MySQL está rodando');
    console.log('4. Verifique se o usuário e senha estão corretos');
    console.log('5. Verifique se o banco existe');
    console.log('');
    console.log('📋 COMANDOS ÚTEIS:');
    console.log('ssh usuario@seu-ip-oracle');
    console.log('sudo systemctl status mysql');
    console.log('sudo ufw status');
    console.log('mysql -u comunikapp -p -h localhost');
  }
}

// Executar teste
testConnection();
