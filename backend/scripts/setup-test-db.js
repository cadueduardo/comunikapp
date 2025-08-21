#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando banco de teste para comunicapp...\n');

// 1. Verificar se o arquivo de configuração existe
const configFile = path.join(__dirname, '..', 'config-teste.env');
if (!fs.existsSync(configFile)) {
  console.error('❌ Arquivo config-teste.env não encontrado!');
  process.exit(1);
}

// 2. Copiar configuração para .env
try {
  const configContent = fs.readFileSync(configFile, 'utf8');
  const envFile = path.join(__dirname, '..', '.env');
  fs.writeFileSync(envFile, configContent);
  console.log('✅ Configuração de teste copiada para .env');
} catch (error) {
  console.error('❌ Erro ao copiar configuração:', error.message);
  process.exit(1);
}

// 3. Gerar cliente Prisma
try {
  console.log('🔄 Gerando cliente Prisma...');
  execSync('npm run db:generate', { 
    cwd: path.join(__dirname, '..'), 
    stdio: 'inherit' 
  });
  console.log('✅ Cliente Prisma gerado');
} catch (error) {
  console.error('❌ Erro ao gerar cliente Prisma:', error.message);
}

  // 4. Executar push do banco (mais simples que migrações)
  try {
    console.log('🔄 Sincronizando schema com banco...');
    execSync('npm run db:push', { 
      cwd: path.join(__dirname, '..'), 
      stdio: 'inherit' 
    });
    console.log('✅ Schema sincronizado com banco');
  } catch (error) {
    console.error('❌ Erro ao sincronizar schema:', error.message);
  }

console.log('\n🎉 Configuração de teste concluída!');
console.log('📋 Próximos passos:');
console.log('   1. Verifique se o banco comunikapp_teste foi criado no MySQL');
console.log('   2. Execute: npm run dev:test');
console.log('   3. Frontend estará em: http://localhost:3003');
console.log('   4. Backend estará em: http://localhost:3002');
