# Configuração do Ambiente - Comunikapp

## 🔧 CONFIGURAÇÃO NECESSÁRIA

Para resolver o erro de autenticação do banco de dados, você precisa criar um arquivo `.env` na pasta `backend/` com as seguintes configurações:

### 📁 CRIAR ARQUIVO: `backend/.env`

```env
# Database Configuration
DATABASE_URL="mysql://root:password@localhost:3306/comunikapp"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Mail Configuration
MAIL_HOST="smtp.ethereal.email"
MAIL_PORT=587
MAIL_USER="test@ethereal.email"
MAIL_PASS="test-password"

# Estoque Module Configuration
ESTOQUE_MODULE_ENABLED=true
ESTOQUE_INTERNAL_API_TOKEN=estoque-internal-token-123
ESTOQUE_ALLOWED_ROLES=ADMINISTRADOR,FINANCEIRO,ESTOQUE

# App Configuration
PORT=3001
NODE_ENV=development

# Stripe Configuration (opcional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# File Upload Configuration
UPLOAD_DEST="./uploads"
MAX_FILE_SIZE=5242880
```

## 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS

### 1. Instalar MySQL (se não tiver)
```bash
# Windows (usando chocolatey)
choco install mysql

# Ou baixar do site oficial: https://dev.mysql.com/downloads/
```

### 2. Criar banco de dados
```sql
CREATE DATABASE comunikapp;
CREATE USER 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Atualizar DATABASE_URL no .env
```env
DATABASE_URL="mysql://comunikapp:password@localhost:3306/comunikapp"
```

## 🚀 COMANDOS PARA EXECUTAR

### 1. Gerar cliente Prisma
```bash
cd backend
npx prisma generate
```

### 2. Executar migrações
```bash
npx prisma migrate dev
```

### 3. Iniciar aplicação
```bash
npm run start:dev
```

## 🔍 VERIFICAÇÃO

Após criar o arquivo `.env` e configurar o banco:

1. **Testar conexão**:
```bash
npx prisma db pull
```

2. **Verificar se o banco está acessível**:
```bash
mysql -u comunikapp -p comunikapp
```

## ⚠️ PROBLEMAS COMUNS

### Erro de autenticação
- Verificar se o usuário MySQL existe
- Verificar se a senha está correta
- Verificar se o banco `comunikapp` existe

### Erro de conexão
- Verificar se o MySQL está rodando
- Verificar se a porta 3306 está livre
- Verificar firewall/antivírus

### Erro de permissões
- Verificar se o usuário tem privilégios no banco
- Executar `FLUSH PRIVILEGES` no MySQL

## 📝 NOTAS

- O arquivo `.env` não deve ser commitado no git
- Use senhas fortes em produção
- Configure variáveis de ambiente adequadas para cada ambiente
