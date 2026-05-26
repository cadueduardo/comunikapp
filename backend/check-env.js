require('dotenv').config();

function status(name, value, extra = '') {
  console.log(`${name}: ${value ? `configured${extra}` : 'missing'}`);
}

console.log('🔍 Verificando variáveis de ambiente...');
status('DATABASE_URL', process.env.DATABASE_URL);
status(
  'JWT_SECRET',
  process.env.JWT_SECRET,
  process.env.JWT_SECRET ? ` length=${process.env.JWT_SECRET.length}` : '',
);
status('ESTOQUE_INTERNAL_API_TOKEN', process.env.ESTOQUE_INTERNAL_API_TOKEN);
console.log('PORT:', process.env.PORT || 'missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'missing');

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


