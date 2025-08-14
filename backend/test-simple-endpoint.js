const fetch = require('node-fetch');

async function testSimpleEndpoint() {
  try {
    console.log('🔍 Testando endpoint simples...');
    
    const response = await fetch('http://localhost:3001/api/estoque/health/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.text();
      console.log('Resposta:', data);
    } else {
      console.log('Erro:', response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testSimpleEndpoint();


