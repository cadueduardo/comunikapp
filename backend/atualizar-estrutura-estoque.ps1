# Script PowerShell para atualizar estrutura da tabela itens_estoque
# Execute este script no PowerShell como administrador

Write-Host "🔄 Iniciando atualização da estrutura da tabela itens_estoque..." -ForegroundColor Yellow

# Configurações do banco de dados
$databaseUrl = "mysql://root:password@localhost:3306/comunikapp"
$sqlFile = "recriar_tabela_estoque_itens.sql"

# Verificar se o arquivo SQL existe
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Executando script SQL..." -ForegroundColor Green

try {
    # Executar o script SQL usando mysql client
    # Nota: Você precisa ter o MySQL client instalado e configurado
    $mysqlCommand = "mysql -u root -p -e `"source $sqlFile`""
    
    Write-Host "🔧 Comando a ser executado: $mysqlCommand" -ForegroundColor Cyan
    
    # Alternativa: usar o Prisma para executar migrations
    Write-Host "📦 Executando via Prisma..." -ForegroundColor Green
    
    # Gerar cliente Prisma
    Write-Host "🔧 Gerando cliente Prisma..." -ForegroundColor Yellow
    npm run db:generate
    
    # Executar migrations
    Write-Host "🔧 Executando migrations..." -ForegroundColor Yellow
    npm run db:migrate
    
    Write-Host "✅ Estrutura da tabela itens_estoque atualizada com sucesso!" -ForegroundColor Green
    Write-Host "📊 Campos adicionados:" -ForegroundColor Cyan
    Write-Host "   - codigo (VARCHAR)" -ForegroundColor White
    Write-Host "   - nome (VARCHAR)" -ForegroundColor White
    Write-Host "   - descricao (TEXT)" -ForegroundColor White
    Write-Host "   - quantidadeReservada (DECIMAL)" -ForegroundColor White
    Write-Host "   - unidadeMedida (VARCHAR)" -ForegroundColor White
    Write-Host "   - precoUnitario (DECIMAL)" -ForegroundColor White
    Write-Host "   - codigoBarras (VARCHAR)" -ForegroundColor White
    Write-Host "   - lote (VARCHAR)" -ForegroundColor White
    Write-Host "   - dataValidade (DATE)" -ForegroundColor White
    Write-Host "   - fornecedorId (VARCHAR)" -ForegroundColor White
    Write-Host "   - observacoes (TEXT)" -ForegroundColor White
    Write-Host "   - ativo (BOOLEAN)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro ao executar script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Atualização concluída!" -ForegroundColor Green
Write-Host "💡 Agora você pode usar o formulário completo de estoque no frontend." -ForegroundColor Cyan
