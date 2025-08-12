const jwt = require('jsonwebtoken');

function gerarTokenValido() {
  console.log('🔑 Gerando token válido para o frontend...');
  
  const agora = Math.floor(Date.now() / 1000);
  
  // Gerar um novo token válido com a estrutura correta
  const payload = {
    sub: 'user-123', // user id
    email: 'admin@comunikapp.com',
    loja_id: 'cme1ops150000w4ikkdtq0h3x', // loja_id
    funcao: 'ADMINISTRADOR',
    nome_completo: 'Administrador Comunikapp',
    iat: agora,
    exp: agora + (60 * 60 * 24) // 24 horas
  };
  
  const token = jwt.sign(payload, 'your-super-secret-jwt-key-change-this-in-production', { algorithm: 'HS256' });
  
  console.log('\n✅ Token gerado com sucesso!');
  console.log('\n📋 Para usar no frontend, execute no console do navegador:');
  console.log(`localStorage.setItem('access_token', '${token}');`);
  
  console.log('\n🔍 Para verificar se funcionou:');
  console.log('1. Abra o console do navegador (F12)');
  console.log('2. Cole o comando acima');
  console.log('3. Recarregue a página de estoque');
  console.log('4. Verifique se os itens aparecem no grid');
  
  console.log('\n📊 Token decodificado:');
  console.log(JSON.stringify(jwt.decode(token), null, 2));
}

gerarTokenValido();
