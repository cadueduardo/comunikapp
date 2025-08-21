#!/bin/bash

# ===== SCRIPT DE CONFIGURAÇÃO MYSQL PARA ORACLE CLOUD =====
# Execute este script na sua máquina Oracle Cloud

echo "🚀 Configurando MySQL para Oracle Cloud..."
echo "=========================================="

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar MySQL
echo "🗄️ Instalando MySQL Server..."
sudo apt install mysql-server mysql-client -y

# 3. Iniciar e habilitar MySQL
echo "🔄 Iniciando MySQL..."
sudo systemctl start mysql
sudo systemctl enable mysql

# 4. Configurar MySQL para conexões remotas
echo "🌐 Configurando MySQL para conexões remotas..."
sudo sed -i 's/bind-address = 127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf

# 5. Reiniciar MySQL
echo "🔄 Reiniciando MySQL..."
sudo systemctl restart mysql

# 6. Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw allow 3306
sudo ufw --force enable

# 7. Criar usuário e banco
echo "👤 Criando usuário e banco..."
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS comunikapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'comunikapp'@'%' IDENTIFIED BY 'ComunikApp2025!';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'%';
FLUSH PRIVILEGES;
"

# 8. Verificar status
echo "✅ Verificando status..."
sudo systemctl status mysql --no-pager -l

echo ""
echo "🎉 Configuração concluída!"
echo "=========================================="
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Copie o arquivo .env-oracle-cloud-example para .env"
echo "2. Substitua 'seu-ip-oracle' pelo IP da sua máquina"
echo "3. Ajuste a senha se necessário"
echo "4. Execute: npm run db:push (para criar as tabelas)"
echo ""
echo "🔗 String de conexão:"
echo "mysql://comunikapp:ComunikApp2025!@$(curl -s ifconfig.me):3306/comunikapp"
echo ""
echo "⚠️  IMPORTANTE: Altere a senha padrão em produção!"
