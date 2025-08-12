# Script para resolver erro MySQL #1034
# Execute: .\fix-mysql-error.ps1

Write-Host "Resolvendo erro MySQL #1034..." -ForegroundColor Green

# 1. Verificar se MySQL está rodando
Write-Host "Verificando se MySQL esta rodando..." -ForegroundColor Yellow
try {
    $mysqlProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
    if ($mysqlProcess) {
        Write-Host "MySQL esta rodando" -ForegroundColor Green
    } else {
        Write-Host "MySQL nao esta rodando. Iniciando..." -ForegroundColor Yellow
        net start mysql
    }
} catch {
    Write-Host "Erro ao verificar MySQL" -ForegroundColor Red
}

# 2. Tentar reparar o banco
Write-Host "Tentando reparar o banco de dados..." -ForegroundColor Yellow

# Opção 1: Usando mysqlcheck (se disponível)
try {
    mysqlcheck -u root -p --repair --all-databases
    Write-Host "Reparo concluido com mysqlcheck" -ForegroundColor Green
} catch {
    Write-Host "mysqlcheck nao disponivel, tentando alternativa..." -ForegroundColor Yellow
    
    # Opção 2: Usando comandos SQL
    $repairSQL = @"
REPAIR TABLE mysql.db;
REPAIR TABLE mysql.user;
REPAIR TABLE mysql.tables_priv;
REPAIR TABLE mysql.columns_priv;
REPAIR TABLE mysql.procs_priv;
REPAIR TABLE mysql.proxies_priv;
FLUSH PRIVILEGES;
"@
    
    Set-Content -Path "repair_mysql.sql" -Value $repairSQL -Encoding UTF8
    Write-Host "Execute: mysql -u root -p < repair_mysql.sql" -ForegroundColor Cyan
}

# 3. Tentar criar banco novamente
Write-Host "Tentando criar banco novamente..." -ForegroundColor Yellow

$createSQL = @"
CREATE DATABASE IF NOT EXISTS comunikapp;
CREATE USER IF NOT EXISTS 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
"@

Set-Content -Path "create_database.sql" -Value $createSQL -Encoding UTF8

Write-Host "Execute os seguintes comandos:" -ForegroundColor Cyan
Write-Host "1. mysql -u root -p < repair_mysql.sql" -ForegroundColor White
Write-Host "2. mysql -u root -p < create_database.sql" -ForegroundColor White

# 4. Alternativa: Resetar MySQL
Write-Host "Se o problema persistir, tente:" -ForegroundColor Yellow
Write-Host "1. Parar MySQL: net stop mysql" -ForegroundColor White
Write-Host "2. Iniciar MySQL: net start mysql" -ForegroundColor White
Write-Host "3. Ou reinstalar MySQL" -ForegroundColor White

Write-Host "Script concluido!" -ForegroundColor Green
