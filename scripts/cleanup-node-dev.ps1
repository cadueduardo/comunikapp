<#
.SYNOPSIS
  Lista e encerra processos Node relacionados ao Comunikapp (dev travado / muitas instâncias).

.USAGE
  .\scripts\cleanup-node-dev.ps1           # mata só processos do caminho comunikapp
  .\scripts\cleanup-node-dev.ps1 -WhatIf   # só lista
  .\scripts\cleanup-node-dev.ps1 -Force    # mata TODOS os node.exe (cuidado)
#>

param(
  [switch]$Force,
  [switch]$WhatIf
)

$ErrorActionPreference = 'SilentlyContinue'

function Get-NodeProcesses {
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Select-Object ProcessId, CommandLine, @{ N = 'WorkingSetMB'; E = { [math]::Round($_.WorkingSetSize / 1MB, 1) } }
}

$projectMarker = 'comunikapp'
$all = @(Get-NodeProcesses)

if ($all.Count -eq 0) {
  Write-Host 'Nenhum processo node.exe encontrado.' -ForegroundColor Green
  exit 0
}

Write-Host "Processos node.exe encontrados: $($all.Count)" -ForegroundColor Cyan

$targets = if ($Force) {
  $all
} else {
  $all | Where-Object {
    $_.CommandLine -and ($_.CommandLine -match [regex]::Escape($projectMarker))
  }
}

if ($targets.Count -eq 0) {
  Write-Host "Nenhum processo vinculado a '$projectMarker'. Use -Force para listar todos ou matar tudo." -ForegroundColor Yellow
  $all | ForEach-Object {
    $cmd = if ($_.CommandLine) { $_.CommandLine.Substring(0, [Math]::Min(120, $_.CommandLine.Length)) } else { '(sem cmdline)' }
    Write-Host "  PID $($_.ProcessId) | $($_.WorkingSetMB) MB | $cmd"
  }
  exit 0
}

foreach ($proc in $targets) {
  $cmd = if ($proc.CommandLine) { $proc.CommandLine.Substring(0, [Math]::Min(100, $proc.CommandLine.Length)) } else { '(sem cmdline)' }
  if ($WhatIf) {
    Write-Host "[WhatIf] Mataria PID $($proc.ProcessId) | $($proc.WorkingSetMB) MB | $cmd" -ForegroundColor DarkYellow
  } else {
    Write-Host "Encerrando PID $($proc.ProcessId) | $($proc.WorkingSetMB) MB | $cmd" -ForegroundColor Yellow
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

if (-not $WhatIf) {
  Start-Sleep -Seconds 1
  $remaining = @(Get-NodeProcesses)
  if ($Force) {
    Write-Host "Restantes (node.exe): $($remaining.Count)" -ForegroundColor $(if ($remaining.Count -eq 0) { 'Green' } else { 'Yellow' })
  } else {
    $projectRemaining = @($remaining | Where-Object { $_.CommandLine -match [regex]::Escape($projectMarker) })
    Write-Host "Restantes do projeto: $($projectRemaining.Count)" -ForegroundColor $(if ($projectRemaining.Count -eq 0) { 'Green' } else { 'Yellow' })
  }
}

Write-Host 'Concluido. Suba o ambiente com: npm run dev' -ForegroundColor Green
