const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Gerar token válido
const payload = {
  sub: 'user-123',
  email: 'test@example.com',
  loja_id: 'loja-456',
  funcao: 'ADMINISTRADOR',
  nome_completo: 'Usuário Teste'
};

const secret = 'your-super-secret-jwt-key-change-this-in-production';
const token = jwt.sign(payload, secret, { expiresIn: '24h' });

console.log('Token gerado:', token);

// Testar API de estoque
async function testEstoqueAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/estoque/itens/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());

    if (response.ok) {
      const data = await response.json();
      console.log('Resposta:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Erro:', errorText);
    }
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
}

testEstoqueAPI();


