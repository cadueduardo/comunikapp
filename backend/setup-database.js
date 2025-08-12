#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Configurando banco de dados para Comunikapp...\n');

// Verificar se o arquivo .env existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Criando arquivo .env...');
  
  const envContent = `# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/comunikapp"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Mail Configuration
MAIL_HOST="smtp.ethereal.email"
MAIL_PORT=587
MAIL_USER="test@ethereal.email"
MAIL_PASS="test-password"

# Estoque Module Configuration
ESTOQUE_MODULE_ENABLED=true
ESTOQUE_INTERNAL_API_TOKEN=estoque-internal-token-123
ESTOQUE_ALLOWED_ROLES=ADMINISTRADOR,FINANCEIRO,ESTOQUE

# App Configuration
PORT=3001
NODE_ENV=development

# Stripe Configuration (opcional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# File Upload Configuration
UPLOAD_DEST="./uploads"
MAX_FILE_SIZE=5242880
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log('⚠️  IMPORTANTE: Configure a DATABASE_URL com suas credenciais do MySQL\n');
} else {
  console.log('✅ Arquivo .env já existe');
}

// Verificar se o Prisma está instalado
try {
  console.log('🔍 Verificando instalação do Prisma...');
  execSync('npx prisma --version', { stdio: 'pipe' });
  console.log('✅ Prisma está instalado');
} catch (error) {
  console.log('❌ Prisma não está instalado. Instalando...');
  execSync('npm install prisma @prisma/client', { stdio: 'inherit' });
}

// Gerar cliente Prisma
try {
  console.log('🔧 Gerando cliente Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma gerado com sucesso');
} catch (error) {
  console.log('❌ Erro ao gerar cliente Prisma:', error.message);
  console.log('💡 Verifique se o MySQL está rodando e acessível');
}

// Verificar conexão com banco
try {
  console.log('🔍 Testando conexão com banco de dados...');
  execSync('npx prisma db pull', { stdio: 'pipe' });
  console.log('✅ Conexão com banco de dados OK');
} catch (error) {
  console.log('❌ Erro de conexão com banco de dados');
  console.log('💡 Verifique:');
  console.log('   1. Se o MySQL está rodando');
  console.log('   2. Se as credenciais no .env estão corretas');
  console.log('   3. Se o banco "comunikapp" existe');
  console.log('\n📋 Comandos para criar banco:');
  console.log('   mysql -u root -p');
  console.log('   CREATE DATABASE comunikapp;');
  console.log('   CREATE USER "comunikapp"@"localhost" IDENTIFIED BY "password";');
  console.log('   GRANT ALL PRIVILEGES ON comunikapp.* TO "comunikapp"@"localhost";');
  console.log('   FLUSH PRIVILEGES;');
  console.log('   exit;');
}

// Executar migrações
try {
  console.log('🚀 Executando migrações...');
  execSync('npx prisma migrate dev', { stdio: 'inherit' });
  console.log('✅ Migrações executadas com sucesso');
} catch (error) {
  console.log('❌ Erro ao executar migrações:', error.message);
}

console.log('\n🎉 Configuração concluída!');
console.log('📋 Próximos passos:');
console.log('   1. Configure as credenciais do MySQL no arquivo .env');
console.log('   2. Execute: npm run start:dev');
console.log('   3. Acesse: http://localhost:3001');
