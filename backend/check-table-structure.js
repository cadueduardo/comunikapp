// Verificar estrutura da tabela catalogo_insumos
console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA');
console.log('===================================\n');

const mysql = require('mysql2/promise');

async function checkTableStructure() {
  try {
    const connection = await mysql.createConnection({
      host: 'srv802.hstgr.io',
      user: 'u849952347_comunikapp',
      password: 'C@du27140797130622',
      database: 'u849952347_comunikapp'
    });

    console.log('📋 ESTRUTURA DA TABELA catalogo_insumos:\n');
    
    // Verificar estrutura da tabela
    const [columns] = await connection.execute('DESCRIBE catalogo_insumos');
    
    columns.forEach(column => {
      console.log(`${column.Field.padEnd(25)} | ${column.Type.padEnd(20)} | ${column.Null} | ${column.Key} | ${column.Default || 'NULL'}`);
    });

    console.log('\n📊 DADOS EXISTENTES NA TABELA:\n');
    
    // Verificar dados existentes
    const [rows] = await connection.execute('SELECT * FROM catalogo_insumos LIMIT 5');
    
    if (rows.length === 0) {
      console.log('❌ Tabela está vazia');
    } else {
      rows.forEach((row, index) => {
        console.log(`Registro ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        console.log('');
      });
    }

    await connection.end();
    
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
  }
}

checkTableStructure();

