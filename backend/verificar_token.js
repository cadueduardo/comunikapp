const jwt = require('jsonwebtoken');

function verificarToken() {
  console.log('🔍 Verificando token...');
  
  // Token atual que está sendo usado
  const tokenAtual = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWUxb3BzMTUwMDAwZzRpa2tkdHEwaDN4IiwibmFtZSI6IkNvbXVuaWthcHAiLCJpYXQiOjE3MzQ2MDA4NjIsImV4cCI6MTczNDY4NzI2Mn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
  
  try {
    // Tentar decodificar o token atual
    const decoded = jwt.decode(tokenAtual);
    console.log('📋 Token atual decodificado:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Verificar se está expirado
    const agora = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < agora) {
      console.log('❌ Token expirado!');
      console.log(`   Expira em: ${new Date(decoded.exp * 1000)}`);
      console.log(`   Agora: ${new Date(agora * 1000)}`);
    } else {
      console.log('✅ Token ainda válido');
    }
    
    // Gerar um novo token válido
    const payload = {
      sub: 'user-123', // user id
      email: 'admin@comunikapp.com',
      loja_id: 'cme1ops150000w4ikkdtq0h3x', // loja_id
      funcao: 'ADMINISTRADOR',
      nome_completo: 'Administrador Comunikapp',
      iat: agora,
      exp: agora + (60 * 60 * 24) // 24 horas
    };
    
    const novoToken = jwt.sign(payload, 'your-super-secret-jwt-key-change-this-in-production', { algorithm: 'HS256' });
    
    console.log('\n🆕 Novo token gerado:');
    console.log(novoToken);
    
    console.log('\n📋 Para usar no frontend:');
    console.log(`localStorage.setItem('access_token', '${novoToken}');`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error);
  }
}

verificarToken();
