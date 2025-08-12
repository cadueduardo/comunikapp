const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com MySQL...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'comunikapp',
      password: 'password',
      database: 'comunikapp'
    });
    
    console.log('✅ Conexão estabelecida com sucesso');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query de teste executada:', rows);
    
    await connection.end();
    console.log('✅ Conexão fechada');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  }
}

testConnection();


