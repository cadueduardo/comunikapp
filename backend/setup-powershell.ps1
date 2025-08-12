# Script PowerShell para configurar Comunikapp
# Execute: .\setup-powershell.ps1

Write-Host "Configurando Comunikapp no PowerShell..." -ForegroundColor Green

# 1. Verificar se MySQL está instalado
Write-Host "Verificando MySQL..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version 2>$null
    if ($mysqlVersion) {
        Write-Host "MySQL encontrado: $mysqlVersion" -ForegroundColor Green
    } else {
        Write-Host "MySQL nao encontrado. Instale o MySQL primeiro." -ForegroundColor Red
        Write-Host "Baixe em: https://dev.mysql.com/downloads/" -ForegroundColor Cyan
        exit 1
    }
} catch {
    Write-Host "MySQL nao encontrado. Instale o MySQL primeiro." -ForegroundColor Red
    exit 1
}

# 2. Criar arquivo .env
Write-Host "Configurando arquivo .env..." -ForegroundColor Yellow

$envContent = @"
# Database Configuration
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
"@

Set-Content -Path ".env" -Value $envContent -Encoding UTF8
Write-Host "Arquivo .env criado/atualizado" -ForegroundColor Green

# 3. Configurar banco de dados
Write-Host "Configurando banco de dados..." -ForegroundColor Yellow

# Criar script SQL temporário
$sqlScript = @"
CREATE DATABASE IF NOT EXISTS comunikapp;
CREATE USER IF NOT EXISTS 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES;
"@

Set-Content -Path "temp_setup.sql" -Value $sqlScript -Encoding UTF8

# Executar script SQL
Write-Host "Execute os seguintes comandos no MySQL:" -ForegroundColor Cyan
Write-Host "mysql -u root -p < temp_setup.sql" -ForegroundColor White
Write-Host "Ou conecte manualmente e execute:" -ForegroundColor White
Write-Host "mysql -u root -p" -ForegroundColor White
Write-Host "CREATE DATABASE comunikapp;" -ForegroundColor White
Write-Host "CREATE USER 'comunikapp'@'localhost' IDENTIFIED BY 'password';" -ForegroundColor White
Write-Host "GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';" -ForegroundColor White
Write-Host "FLUSH PRIVILEGES;" -ForegroundColor White
Write-Host "exit;" -ForegroundColor White

# 4. Perguntar se quer executar automaticamente
$executeSQL = Read-Host "Deseja executar os comandos SQL automaticamente? (s/n)"
if ($executeSQL -eq "s" -or $executeSQL -eq "S") {
    Write-Host "Executando comandos SQL..." -ForegroundColor Yellow
    try {
        mysql -u root -p < temp_setup.sql
        Write-Host "Banco de dados configurado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "Erro ao executar comandos SQL. Execute manualmente." -ForegroundColor Red
    }
}

# 5. Limpar arquivo temporário
if (Test-Path "temp_setup.sql") {
    Remove-Item "temp_setup.sql"
}

# 6. Gerar cliente Prisma
Write-Host "Gerando cliente Prisma..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "Cliente Prisma gerado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao gerar cliente Prisma" -ForegroundColor Red
}

# 7. Testar conexão
Write-Host "Testando conexao com banco..." -ForegroundColor Yellow
try {
    npx prisma db pull
    Write-Host "Conexao com banco OK!" -ForegroundColor Green
} catch {
    Write-Host "Erro de conexao. Verifique as credenciais no .env" -ForegroundColor Red
}

Write-Host "Configuracao concluida!" -ForegroundColor Green
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure a senha do MySQL no arquivo .env" -ForegroundColor White
Write-Host "2. Execute: npm run start:dev" -ForegroundColor White
Write-Host "3. Acesse: http://localhost:3001" -ForegroundColor White
