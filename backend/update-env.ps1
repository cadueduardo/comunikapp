# Script para atualizar o arquivo .env
# Execute: .\update-env.ps1

Write-Host "Atualizando arquivo .env de desenvolvimento..." -ForegroundColor Green
Write-Host "Nao use este script em producao/VPS. Configure secrets reais fora do repositorio." -ForegroundColor Yellow

# Backup do arquivo atual
if (Test-Path ".env") {
    Copy-Item ".env" ".env.backup"
    Write-Host "Backup criado: .env.backup" -ForegroundColor Yellow
}

# Conteúdo correto do .env
$envContent = @"
# ===== CONFIGURAÇÃO PRINCIPAL DO PROJETO =====

# Database Configuration (PRINCIPAL)
DATABASE_URL="mysql://usuario:senha-forte@127.0.0.1:3306/comunikapp"

# JWT Configuration
JWT_SECRET="troque-por-um-segredo-local-com-64-caracteres-ou-mais"
JWT_EXPIRES_IN="7d"

# Mail Configuration
MAIL_HOST="smtp.ethereal.email"
MAIL_PORT=587
MAIL_USER=""
MAIL_PASS=""

# App Configuration
PORT=3001
NODE_ENV=development

# ===== MÓDULO DE ESTOQUE =====

# Estoque Module Configuration
ESTOQUE_MODULE_ENABLED=true
ESTOQUE_INTERNAL_API_TOKEN="troque-por-token-local-com-64-caracteres-ou-mais"
ESTOQUE_ALLOWED_ROLES="ADMINISTRADOR,FINANCEIRO,ESTOQUE"

# Estoque Database (usando o mesmo banco principal)
ESTOQUE_DATABASE_URL="mysql://usuario:senha-forte@127.0.0.1:3306/comunikapp"

# Estoque Performance Settings
ESTOQUE_DB_CONNECTION_LIMIT=10
ESTOQUE_DB_POOL_TIMEOUT=20000
ESTOQUE_DB_POOL_IDLE_TIMEOUT=10000
ESTOQUE_DEFAULT_LIMIT=20
ESTOQUE_MAX_LIMIT=100
ESTOQUE_CACHE_DURATION=300
ESTOQUE_SLOW_QUERY_THRESHOLD=1000

# Estoque Health Checks
ESTOQUE_HEALTH_CHECK_INTERVAL=30000
ESTOQUE_ENABLE_MONITORING=true

# Estoque Validation Settings
ESTOQUE_MAX_LOCATION_CODE_LENGTH=20
ESTOQUE_MAX_LOT_NUMBER_LENGTH=50
ESTOQUE_MAX_DOCUMENT_REF_LENGTH=100
ESTOQUE_MAX_OBSERVATIONS_LENGTH=255

# Estoque Notifications
ESTOQUE_ENABLE_LOW_STOCK_ALERTS=true
ESTOQUE_ENABLE_EXPIRY_ALERTS=true
ESTOQUE_ALERT_THRESHOLD=7

# Estoque Logs
ESTOQUE_LOG_LEVEL="info"
ESTOQUE_ENABLE_QUERY_LOGS=true
ESTOQUE_ENABLE_PERFORMANCE_LOGS=true

# ===== CONFIGURAÇÕES OPCIONAIS =====

# Stripe Configuration (opcional)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# File Upload Configuration
UPLOAD_DEST="./uploads"
MAX_FILE_SIZE=5242880
"@

# Criar novo arquivo .env
Set-Content -Path ".env" -Value $envContent -Encoding UTF8

Write-Host "Arquivo .env atualizado com sucesso!" -ForegroundColor Green
Write-Host "Principais mudanças:" -ForegroundColor Cyan
Write-Host "- Usando banco principal: comunikapp" -ForegroundColor White
Write-Host "- Usuário: comunikapp" -ForegroundColor White
Write-Host "- Secrets reais nao foram impressos nem gerados por este script" -ForegroundColor White
Write-Host "- Removidas configurações antigas" -ForegroundColor White

Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure a senha correta do MySQL" -ForegroundColor White
Write-Host "2. Execute: npx prisma generate" -ForegroundColor White
Write-Host "3. Execute: npx prisma migrate dev" -ForegroundColor White
Write-Host "4. Execute: npm run start:dev" -ForegroundColor White
