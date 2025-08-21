# Script para gerenciar portas do backend
param(
    [string]$Porta = "4000",
    [switch]$Limpar,
    [switch]$Verificar,
    [switch]$Iniciar
)

Write-Host "GERENCIADOR DE PORTAS - COMUNIKAPP BACKEND" -ForegroundColor Cyan

if ($Verificar) {
    Write-Host "Verificando porta $Porta..." -ForegroundColor Yellow
    $processos = netstat -ano | findstr ":$Porta"
    
    if ($processos) {
        Write-Host "Porta $Porta esta em uso:" -ForegroundColor Red
        Write-Host $processos -ForegroundColor Red
    } else {
        Write-Host "Porta $Porta esta livre!" -ForegroundColor Green
    }
}

if ($Limpar) {
    Write-Host "Limpando porta $Porta..." -ForegroundColor Yellow
    
    $processos = netstat -ano | findstr ":$Porta"
    if ($processos) {
        $pids = $processos | ForEach-Object { 
            if ($_ -match '\s+(\d+)$') { $matches[1] } 
        } | Sort-Object -Unique
        
        foreach ($pid in $pids) {
            Write-Host "Finalizando processo PID: $pid" -ForegroundColor Yellow
            taskkill /PID $pid /F | Out-Null
        }
        
        Start-Sleep -Seconds 2
        $processosApos = netstat -ano | findstr ":$Porta"
        if (-not $processosApos) {
            Write-Host "Porta $Porta liberada com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "Ainda ha processos na porta $Porta" -ForegroundColor Red
        }
    } else {
        Write-Host "Porta $Porta ja esta livre" -ForegroundColor Blue
    }
}

if ($Iniciar) {
    Write-Host "Iniciando backend na porta $Porta..." -ForegroundColor Yellow
    
    $processos = netstat -ano | findstr ":$Porta"
    if ($processos) {
        Write-Host "Porta $Porta esta em uso. Execute primeiro: .\gerenciar-portas.ps1 -Limpar" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Porta livre, iniciando backend..." -ForegroundColor Green
    npm run start:dev
}

if (-not ($Verificar -or $Limpar -or $Iniciar)) {
    Write-Host "USO DO SCRIPT:" -ForegroundColor Cyan
    Write-Host "  .\gerenciar-portas.ps1 -Verificar" -ForegroundColor White
    Write-Host "  .\gerenciar-portas.ps1 -Limpar" -ForegroundColor White
    Write-Host "  .\gerenciar-portas.ps1 -Iniciar" -ForegroundColor White
    Write-Host "  .\gerenciar-portas.ps1 -Limpar -Iniciar" -ForegroundColor White
}





