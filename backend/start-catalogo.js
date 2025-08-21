// ===== SCRIPT SIMPLES PARA EXECUTAR MÓDULO CATÁLOGO =====
const { spawn } = require('child_process');
const path = require('path');

// Configurar variáveis de ambiente
process.env.CATALOGO_INSUMOS_DATABASE_URL = "mysql://u849952347_comunikapp:C@du27140797130622@localhost:3306/u849952347_comunikapp";
process.env.CATALOGO_INSUMOS_PORT = "3001";

console.log('🚀 Iniciando módulo Catálogo de Insumos...');
console.log('📡 Porta:', process.env.CATALOGO_INSUMOS_PORT);
console.log('🗄️  Banco:', process.env.CATALOGO_INSUMOS_DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

// Executar o arquivo TypeScript
const tsNode = spawn('npx', ['ts-node', 'src/catalogo-insumos/main-catalogo.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

tsNode.on('error', (error) => {
  console.error('❌ Erro ao executar:', error.message);
  process.exit(1);
});

tsNode.on('exit', (code) => {
  console.log(`\n📤 Processo finalizado com código: ${code}`);
  process.exit(code);
});

// Capturar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Parando servidor...');
  tsNode.kill('SIGINT');
});
