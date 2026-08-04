// Template de runtime do artefato imutável. Não aponta para checkout Git.
// O Next standalone é iniciado diretamente por `server.js`; .next/static e public
// já são copiados pelo empacotador para o mesmo diretório.
module.exports = {
  apps: [
    {
      name: 'comunikapp-backend',
      cwd: '/srv/apps/comunikapp/current/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      kill_timeout: 5000,
      out_file: '/srv/apps/comunikapp/.pm2/logs/comunikapp-backend-out.log',
      error_file: '/srv/apps/comunikapp/.pm2/logs/comunikapp-backend-error.log',
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
      cwd: '/srv/apps/comunikapp/current/frontend/.next/standalone',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      kill_timeout: 5000,
      out_file: '/srv/apps/comunikapp/.pm2/logs/comunikapp-frontend-out.log',
      error_file: '/srv/apps/comunikapp/.pm2/logs/comunikapp-frontend-error.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: '3001',
        TZ: 'America/Sao_Paulo',
      },
    },
  ],
};
