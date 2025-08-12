const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🔍 Testando se o backend está respondendo...');
    
    // Testar endpoint de health
    const response = await fetch('http://localhost:3001/api/estoque/health', {
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

testAPI();


