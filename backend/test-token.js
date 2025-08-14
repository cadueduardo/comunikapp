const jwt = require('jsonwebtoken');

// Simular um token válido
const payload = {
  sub: 'user-123',
  email: 'test@example.com',
  loja_id: 'loja-456',
  funcao: 'ADMINISTRADOR',
  nome_completo: 'Usuário Teste'
};

const secret = 'your-super-secret-jwt-key-change-this-in-production';

try {
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });
  console.log('Token gerado:', token);
  
  const decoded = jwt.verify(token, secret);
  console.log('Token decodificado:', JSON.stringify(decoded, null, 2));
  
  console.log('LojaId:', decoded.loja_id);
  console.log('UsuarioId:', decoded.sub);
  console.log('Função:', decoded.funcao);
  
} catch (error) {
  console.error('Erro:', error.message);
}


