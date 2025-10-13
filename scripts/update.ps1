# Script de Atualização - ComunikApp
# Execute após git pull ou restaurar branch

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  ComunikApp - Atualização" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na raiz do projeto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script da raiz do projeto!" -ForegroundColor Red
    exit 1
}

# 1. Verificar mudanças no Git
Write-Host "🔍 Verificando status do Git..." -ForegroundColor Yellow
git status --short
Write-Host ""

# 2. Atualizar dependências se necessário
$updateDeps = Read-Host "Atualizar dependências? (s/n) [Recomendado se package.json mudou]"
if ($updateDeps -eq "s") {
    Write-Host ""
    Write-Host "📦 Atualizando dependências do backend..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    
    Write-Host "📦 Atualizando dependências do frontend..." -ForegroundColor Cyan
    Set-Location ../frontend
    npm install
    
    Set-Location ..
}

# 3. Regenerar Prisma Client (SEMPRE necessário)
Write-Host ""
Write-Host "🗄️  Regenerando Prisma Client..." -ForegroundColor Cyan
Set-Location backend
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar Prisma Client" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 4. Sincronizar schema com banco
Write-Host ""
Write-Host "🗄️  Sincronizando schema com banco..." -ForegroundColor Cyan
$syncDB = Read-Host "Aplicar mudanças no banco de dados? (s/n) [Necessário se schema.prisma mudou]"
if ($syncDB -eq "s") {
    npm run db:push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Erro ao sincronizar banco. Execute manualmente se necessário." -ForegroundColor Yellow
    }
}

# 5. Limpar e recompilar backend
Write-Host ""
Write-Host "🔨 Limpando cache e recompilando backend..." -ForegroundColor Cyan
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item tsconfig.build.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
npx tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar backend" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# 6. Recompilar Sharp se necessário
$rebuildSharp = Read-Host "Recompilar Sharp? (s/n) [Necessário se teve problemas com upload de imagens]"
if ($rebuildSharp -eq "s") {
    Write-Host ""
    Write-Host "🖼️  Recompilando Sharp..." -ForegroundColor Cyan
    npm rebuild sharp
}

# 7. Limpar cache do frontend
Write-Host ""
Write-Host "🧹 Limpando cache do frontend..." -ForegroundColor Cyan
Set-Location ../frontend
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Voltar para raiz
Set-Location ..

# Verificar pastas conflitantes
Write-Host ""
Write-Host "🔍 Verificando conflitos de rotas..." -ForegroundColor Yellow
$conflictPath = "frontend\src\app\api\arte-aprovacao\versoes\[versaoId]"
if (Test-Path $conflictPath) {
    Write-Host "⚠️  Detectada pasta conflitante: [versaoId]" -ForegroundColor Yellow
    Write-Host "   Esta pasta causa conflito com [id] e impede o Next.js de iniciar." -ForegroundColor Gray
    $removeConflict = Read-Host "Remover pasta conflitante? (s/n) [Recomendado: s]"
    if ($removeConflict -eq "s") {
        Remove-Item -Recurse -Force $conflictPath
        Write-Host "✅ Pasta conflitante removida" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Sem conflitos de rotas detectados" -ForegroundColor Green
}

# Finalização
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  ✅ Atualização concluída!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Para iniciar o projeto:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📝 Se houver erros ao iniciar:" -ForegroundColor Cyan
Write-Host "   1. Verifique backend/.env" -ForegroundColor White
Write-Host "   2. Verifique se MySQL está rodando" -ForegroundColor White
Write-Host "   3. Execute: cd backend && npm run db:push" -ForegroundColor White
Write-Host ""

