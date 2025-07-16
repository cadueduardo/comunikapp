// Script para testar a autenticação do frontend
async function testFrontendAuth() {
  try {
    console.log('🧪 Testando autenticação do frontend...');
    
    // Simular o processo de login do frontend
    console.log('\n1. Fazendo login...');
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
    
    // Simular o que o frontend faz - armazenar token
    // localStorage.setItem('access_token', loginData.access_token); // Não disponível no Node.js
    
    // Simular a chamada do UserContext
    console.log('\n2. Testando endpoint /me (como o frontend faz)...');
    const meResponse = await fetch('http://localhost:3001/lojas/me', {
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status /me:', meResponse.status);
    console.log('Headers da resposta:', Object.fromEntries(meResponse.headers.entries()));
    
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

// Executar o teste
testFrontendAuth(); 