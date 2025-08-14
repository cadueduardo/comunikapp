# Script PowerShell para atualizar a estrutura da tabela localizacoes
# Execute este script para corrigir a estrutura da tabela no MySQL

Write-Host "Atualizando estrutura da tabela localizacoes..." -ForegroundColor Yellow

# Configuracoes do banco (ajuste conforme necessario)
$MYSQL_HOST = "localhost"
$MYSQL_PORT = "3306"
$MYSQL_USER = "root"
$MYSQL_PASS = ""
$MYSQL_DB = "comunikapp"

# Verificar se o MySQL esta disponivel
try {
    $testConnection = mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASS -e "SELECT 1;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL nao esta acessivel"
    }
    Write-Host "MySQL conectado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "Erro ao conectar com MySQL: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se o MySQL esta rodando e as credenciais estao corretas" -ForegroundColor Yellow
    exit 1
}

# Executar o script SQL
Write-Host "Executando script de atualizacao..." -ForegroundColor Blue

try {
    # Ler o arquivo SQL
    $sqlContent = Get-Content "update_localizacoes_table.sql" -Raw
    
    # Executar o SQL
    $result = mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASS $MYSQL_DB -e $sqlContent 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Estrutura da tabela atualizada com sucesso!" -ForegroundColor Green
        Write-Host "Resultado da execucao:" -ForegroundColor Cyan
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "Erro ao executar script SQL:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "Erro ao executar script: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Verifique se a tabela foi atualizada corretamente" -ForegroundColor White
Write-Host "2. Teste o formulario de localizacao no frontend" -ForegroundColor White
Write-Host "3. Verifique se os dados estao sendo salvos no banco" -ForegroundColor White
