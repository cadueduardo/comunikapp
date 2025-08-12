require('dotenv').config();

console.log('🔍 Verificando variáveis de ambiente...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Verificar se o arquivo .env foi carregado
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
} else {
  console.log('✅ DATABASE_URL configurada');
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET não encontrada');
} else {
  console.log('✅ JWT_SECRET configurada');
}


