# Script para corrigir permissões do Prisma
# Execute: .\fix-prisma-permissions.ps1

Write-Host "Corrigindo permissões do Prisma..." -ForegroundColor Green

# 1. Verificar se MySQL está rodando
Write-Host "Verificando MySQL..." -ForegroundColor Yellow
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

# 2. Executar comandos de permissão
Write-Host "Executando comandos de permissao..." -ForegroundColor Yellow

$permissionSQL = @"
GRANT CREATE ON *.* TO 'comunikapp'@'localhost';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
GRANT CREATE TEMPORARY TABLES ON *.* TO 'comunikapp'@'localhost';
GRANT LOCK TABLES ON comunikapp.* TO 'comunikapp'@'localhost';
GRANT SELECT ON INFORMATION_SCHEMA.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'comunikapp'@'localhost';
"@

Set-Content -Path "fix_permissions.sql" -Value $permissionSQL -Encoding UTF8

Write-Host "Execute os seguintes comandos no MySQL:" -ForegroundColor Cyan
Write-Host "mysql -u root -p < fix_permissions.sql" -ForegroundColor White
Write-Host "Ou conecte manualmente e execute:" -ForegroundColor White
Write-Host "mysql -u root -p" -ForegroundColor White
Write-Host "GRANT CREATE ON *.* TO 'comunikapp'@'localhost';" -ForegroundColor White
Write-Host "GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';" -ForegroundColor White
Write-Host "GRANT CREATE TEMPORARY TABLES ON *.* TO 'comunikapp'@'localhost';" -ForegroundColor White
Write-Host "GRANT LOCK TABLES ON comunikapp.* TO 'comunikapp'@'localhost';" -ForegroundColor White
Write-Host "GRANT SELECT ON INFORMATION_SCHEMA.* TO 'comunikapp'@'localhost';" -ForegroundColor White
Write-Host "FLUSH PRIVILEGES;" -ForegroundColor White
Write-Host "exit;" -ForegroundColor White

# 3. Alternativa: usar root para migrações
Write-Host "Alternativa: Usar root para migracoes" -ForegroundColor Yellow
Write-Host "Edite o .env para usar root temporariamente:" -ForegroundColor White
Write-Host "DATABASE_URL='mysql://root:SUA_SENHA@localhost:3306/comunikapp'" -ForegroundColor White

Write-Host "Script concluido!" -ForegroundColor Green
