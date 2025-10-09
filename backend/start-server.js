const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor backend...');

// Função para iniciar o servidor
function startServer() {
  const serverProcess = spawn('npx', ['nest', 'start', '--watch'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error);
    console.log('🔄 Tentando novamente em 5 segundos...');
    setTimeout(startServer, 5000);
  });

  serverProcess.on('exit', (code) => {
    console.log(`⚠️ Servidor parou com código: ${code}`);
    console.log('🔄 Reiniciando servidor em 3 segundos...');
    setTimeout(startServer, 3000);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Parando servidor...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Parando servidor...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

startServer();





