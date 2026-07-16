// ============================================================================
// PM2 ecosystem para a VPS (produção)
// ----------------------------------------------------------------------------
// Como usar (como usuário 'comunikapp', NUNCA root):
//   cd /opt/comunikapp/app   # ou o PROJECT_DIR real da VPS
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 list
//
// Premissas:
//   - Usuário de aplicação: comunikapp  (home = /opt/comunikapp)
//   - Este arquivo fica na raiz do repositório (cwd dos apps = relativo a __dirname)
//   - Logs PM2 em $HOME/.pm2/logs/ (HOME do usuário comunikapp = /opt/comunikapp)
//   - Apps escutam APENAS em 127.0.0.1 (Nginx é o único exposto)
//   - Portas: API=4001  |  Site=3001
// ============================================================================

const path = require('path');

const root = __dirname;
const pm2Home = process.env.PM2_HOME || path.join(process.env.HOME || '/opt/comunikapp', '.pm2');
const logsDir = path.join(pm2Home, 'logs');

module.exports = {
  apps: [
    {
      name: 'comunikapp-backend',
      cwd: path.join(root, 'backend'),
      script: 'dist/main.js',
      // 1 instância (NestJS com WebSocket/Socket.IO em modo padrão).
      // Para escalar horizontalmente seria necessário Redis adapter para socket.io.
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      kill_timeout: 5000,
      out_file: path.join(logsDir, 'comunikapp-backend-out.log'),
      error_file: path.join(logsDir, 'comunikapp-backend-error.log'),
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '4001',
        TZ: 'America/Sao_Paulo',
      },
    },
    {
      name: 'comunikapp-frontend',
      cwd: path.join(root, 'frontend'),
      // Usa o binário do Next direto, sem npm intermediário (mais leve e previsível).
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3001',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      kill_timeout: 5000,
      out_file: path.join(logsDir, 'comunikapp-frontend-out.log'),
      error_file: path.join(logsDir, 'comunikapp-frontend-error.log'),
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3001',
        TZ: 'America/Sao_Paulo',
      },
    },
  ],
};
