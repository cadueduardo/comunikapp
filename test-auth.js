const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('🧪 Testando autenticação...');
    
    // Teste 1: Login
    console.log('\n1. Testando login...');
    const loginResponse = await fetch('http://localhost:3001/lojas/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@teste.com',
        password: '123456'
      }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Erro no login:', loginResponse.status, errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido');
    console.log('Token:', loginData.access_token ? 'Presente' : 'Ausente');
    
    if (!loginData.access_token) {
      console.log('❌ Token não encontrado na resposta');
      return;
    }

    // Teste 2: Endpoint /me
    console.log('\n2. Testando endpoint /me...');
    const meResponse = await fetch('http://localhost:3001/lojas/me', {
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status /me:', meResponse.status);
    
    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('✅ Endpoint /me funcionando');
      console.log('Usuário:', userData.nome_completo);
    } else {
      const errorText = await meResponse.text();
      console.log('❌ Erro no endpoint /me:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAuth(); 