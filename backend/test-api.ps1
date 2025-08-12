# Script para testar a API de localizações
Write-Host "Testando API de localizações..." -ForegroundColor Yellow

$url = "http://localhost:3001/api/estoque/localizacoes"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer test-token"
}
$body = @{
    codigo = "TEST-001"
    deposito = "Depósito Teste"
    corredor = "A"
    prateleira = "01"
    nivel = "B"
    posicao = "02"
    descricao = "Localização de teste"
    capacidade = 100
    ativo = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "✅ Sucesso: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

