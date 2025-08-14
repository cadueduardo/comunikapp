# Script para testar se o backend está rodando
Write-Host "Testando se o backend está rodando..." -ForegroundColor Yellow

$url = "http://localhost:3001/api/estoque/localizacoes"

try {
    $response = Invoke-RestMethod -Uri $url -Method GET -Headers @{
        "Authorization" = "Bearer test-token"
    } -ErrorAction Stop
    
    Write-Host "✅ Backend está rodando!" -ForegroundColor Green
    Write-Host "Resposta: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend não está rodando ou erro de conexão" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`nTentando iniciar o backend..." -ForegroundColor Yellow
    Write-Host "Execute: npm run start:dev" -ForegroundColor Cyan
}

