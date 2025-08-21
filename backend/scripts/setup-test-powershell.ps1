# ===== SCRIPT POWERSHELL PARA CONFIGURAR TESTE =====
# Execute este script como Administrador no PowerShell

Write-Host "🚀 Configurando ambiente de teste para comunicapp..." -ForegroundColor Green
Write-Host ""

# 1. Verificar se MySQL está rodando
Write-Host "📋 Verificando se MySQL está rodando..." -ForegroundColor Yellow
try {
    $mysqlProcess = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
    if ($mysqlProcess) {
        Write-Host "✅ MySQL está rodando" -ForegroundColor Green
    } else {
        Write-Host "❌ MySQL não está rodando. Inicie o serviço MySQL primeiro." -ForegroundColor Red
        Write-Host "   Use: net start mysql ou inicie o serviço pelo Windows Services" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao verificar MySQL: $_" -ForegroundColor Red
    exit 1
}

# 2. Executar script SQL para configurar banco
Write-Host "🗄️ Configurando banco de dados..." -ForegroundColor Yellow
$sqlScript = Join-Path $PSScriptRoot "setup-mysql-test.sql"
if (Test-Path $sqlScript) {
    Write-Host "📝 Execute o script SQL no MySQL:" -ForegroundColor Cyan
    Write-Host "   mysql -u root -p $sqlScript" -ForegroundColor White
    Write-Host "   Ou copie e cole o conteúdo no MySQL Workbench como ROOT" -ForegroundColor White
} else {
    Write-Host "❌ Script SQL não encontrado: $sqlScript" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Após configurar o banco, execute:" -ForegroundColor Cyan
Write-Host "   cd .." -ForegroundColor White
Write-Host "   npm run dev:test" -ForegroundColor White
Write-Host ""

Write-Host "🌐 URLs de acesso:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3003" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3002" -ForegroundColor White
Write-Host ""

Write-Host "💡 Dica: Se houver problemas de permissão, execute o script SQL como ROOT no MySQL" -ForegroundColor Yellow
Write-Host "   O usuário 'comunikapp' precisa de permissões CREATE, DROP, ALTER no banco" -ForegroundColor Yellow
