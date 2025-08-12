# Solução simples para erro do Prisma Shadow Database
# Execute: .\solucao-simples-prisma.ps1

Write-Host "=== SOLUÇÃO SIMPLES PARA ERRO PRISMA ===" -ForegroundColor Green

Write-Host "Opção 1: Usar --skip-shadow-database" -ForegroundColor Yellow
Write-Host "Execute:" -ForegroundColor White
Write-Host "npx prisma migrate dev --skip-shadow-database" -ForegroundColor Cyan

Write-Host "`nOpção 2: Usar Prisma Push" -ForegroundColor Yellow
Write-Host "Execute:" -ForegroundColor White
Write-Host "npx prisma db push" -ForegroundColor Cyan

Write-Host "`nOpção 3: Usar root temporariamente" -ForegroundColor Yellow
Write-Host "1. Edite o .env:" -ForegroundColor White
Write-Host "DATABASE_URL='mysql://root:SUA_SENHA@localhost:3306/comunikapp'" -ForegroundColor Cyan
Write-Host "2. Execute: npx prisma migrate dev" -ForegroundColor Cyan
Write-Host "3. Volte o .env para comunikapp" -ForegroundColor Cyan

Write-Host "`n=== RECOMENDAÇÃO ===" -ForegroundColor Green
Write-Host "Use a Opção 1 (--skip-shadow-database) - é a mais simples!" -ForegroundColor Yellow

Write-Host "`nComando para executar agora:" -ForegroundColor Green
Write-Host "npx prisma migrate dev --skip-shadow-database" -ForegroundColor Cyan
