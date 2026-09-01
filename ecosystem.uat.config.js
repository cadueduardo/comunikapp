// PM2 UAT — processos separados da produção (portas 4011 / 3011).
// Nunca usar este arquivo no tree /opt/comunikapp/app.
module.exports = {
  apps: [
    {
      name: 'comunikapp-uat-backend',
      cwd: '/srv/apps/comunikapp-uat/app/backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      kill_timeout: 5000,
      out_file: '/srv/apps/comunikapp-uat/shared/logs/backend-out.log',
      error_file: '/srv/apps/comunikapp-uat/shared/logs/backend-error.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '4011',
        TZ: 'America/Sao_Paulo',
      },
    },
    {
      name: 'comunikapp-uat-frontend',
      cwd: '/srv/apps/comunikapp-uat/app/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3011',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
      kill_timeout: 5000,
      out_file: '/srv/apps/comunikapp-uat/shared/logs/frontend-out.log',
      error_file: '/srv/apps/comunikapp-uat/shared/logs/frontend-error.log',
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3011',
        TZ: 'America/Sao_Paulo',
      },
    },
  ],
};
