# Script de Setup Inicial - ComunikApp
# Execute este script após clonar o repositório

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  ComunikApp - Setup Inicial" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na raiz do projeto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script da raiz do projeto!" -ForegroundColor Red
    exit 1
}

# Verificar Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js não encontrado! Instale Node.js 18+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green

# Verificar MySQL
Write-Host "🔍 Verificando MySQL..." -ForegroundColor Yellow
$mysqlRunning = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Where-Object {$_.Status -eq "Running"}
if ($mysqlRunning) {
    Write-Host "✅ MySQL está rodando" -ForegroundColor Green
} else {
    Write-Host "⚠️  MySQL não está rodando. Inicie o MySQL antes de continuar." -ForegroundColor Yellow
    $continue = Read-Host "Continuar mesmo assim? (s/n)"
    if ($continue -ne "s") {
        exit 1
    }
}

# 1. Instalar dependências da raiz
Write-Host ""
Write-Host "📦 Instalando dependências da raiz..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências da raiz" -ForegroundColor Red
    exit 1
}

# 2. Instalar dependências do backend
Write-Host ""
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    exit 1
}

# 3. Recompilar Sharp para Windows
Write-Host ""
Write-Host "🖼️  Recompilando Sharp para Windows..." -ForegroundColor Cyan
npm rebuild sharp
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Erro ao recompilar Sharp (upload de imagens pode não funcionar)" -ForegroundColor Yellow
}

# 4. Configurar .env se não existir
Write-Host ""
Write-Host "⚙️  Configurando variáveis de ambiente..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo .env criado a partir do .env.example" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações!" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Arquivo .env.example não encontrado. Configure .env manualmente." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

# 5. Gerar Prisma Client
Write-Host ""
Write-Host "🗄️  Gerando Prisma Client..." -ForegroundColor Cyan
npm run db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao gerar Prisma Client" -ForegroundColor Red
    exit 1
}

# 6. Sincronizar schema com banco
Write-Host ""
Write-Host "🗄️  Sincronizando schema com banco de dados..." -ForegroundColor Cyan
Write-Host "   (usando db:push - não requer permissões extras)" -ForegroundColor Gray
npm run db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Erro ao sincronizar banco. Verifique se o MySQL está rodando e .env configurado." -ForegroundColor Yellow
    Write-Host "   Você pode tentar manualmente: cd backend && npm run db:push" -ForegroundColor Gray
}

# 7. Compilar backend
Write-Host ""
Write-Host "🔨 Compilando backend..." -ForegroundColor Cyan
npx tsc
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar backend" -ForegroundColor Red
    exit 1
}

# 8. Instalar dependências do frontend
Write-Host ""
Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Cyan
Set-Location ../frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
    exit 1
}

# Voltar para raiz
Set-Location ..

# Finalização
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  ✅ Setup concluído com sucesso!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verifique o arquivo backend/.env" -ForegroundColor White
Write-Host "   2. Inicie o projeto: npm run dev" -ForegroundColor White
Write-Host "   3. Acesse: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Comandos úteis:" -ForegroundColor Cyan
Write-Host "   npm run dev              - Iniciar desenvolvimento" -ForegroundColor White
Write-Host "   npm run dev:test         - Modo de teste" -ForegroundColor White
Write-Host "   cd backend && npm run db:studio - Interface do banco" -ForegroundColor White
Write-Host ""

