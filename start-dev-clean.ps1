# Script para iniciar o servidor de desenvolvimento com limpeza de porta
Write-Host "🧹 Limpando processos Node.js..." -ForegroundColor Yellow

# Matar todos os processos Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Aguardar um pouco para a porta ser liberada
Start-Sleep -Seconds 2

# Verificar se a porta 4000 está livre
$portCheck = netstat -ano | findstr :4000
if ($portCheck) {
    Write-Host "⚠️  Porta 4000 ainda em uso, forçando liberação..." -ForegroundColor Red
    # Matar processos que estão usando a porta 4000
    $processes = netstat -ano | findstr :4000 | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
    foreach ($pid in $processes) {
        if ($pid -and $pid -ne "0") {
            try {
                taskkill /PID $pid /F
                Write-Host "✅ Processo $pid finalizado" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Não foi possível finalizar processo $pid" -ForegroundColor Yellow
            }
        }
    }
    Start-Sleep -Seconds 3
}

Write-Host "🚀 Iniciando servidor de desenvolvimento..." -ForegroundColor Green
npm run dev







