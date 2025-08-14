# 🔧 SOLUÇÃO PARA ERRO DE AUTENTICAÇÃO DO BANCO

## ❌ ERRO ATUAL
```
PrismaClientInitializationError: Authentication failed against database server, the provided database credentials for `user` are not valid.
```

## ✅ SOLUÇÃO RÁPIDA

### 1. Criar arquivo .env
Execute o comando:
```bash
cd backend
npm run setup
```

### 2. Configurar MySQL
Se você não tem MySQL instalado:

**Windows:**
```bash
# Instalar MySQL
choco install mysql

# Ou baixar do site oficial: https://dev.mysql.com/downloads/
```

**macOS:**
```bash
brew install mysql
```

**Linux:**
```bash
sudo apt install mysql-server
```

### 3. Criar banco de dados
```bash
# Conectar ao MySQL
mysql -u root -p

# Executar comandos SQL
CREATE DATABASE comunikapp;
CREATE USER 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
exit;
```

### 4. Atualizar .env
Edite o arquivo `backend/.env` e altere:
```env
DATABASE_URL="mysql://comunikapp:password@localhost:3306/comunikapp"
```

### 5. Executar migrações
```bash
npx prisma generate
npx prisma migrate dev
```

### 6. Iniciar aplicação
```bash
npm run start:dev
```

## 🔍 VERIFICAÇÃO

### Testar conexão:
```bash
npx prisma db pull
```

### Verificar se o banco existe:
```bash
mysql -u comunikapp -p comunikapp
```

## ⚠️ PROBLEMAS COMUNS

### 1. MySQL não está rodando
```bash
# Windows
net start mysql

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### 2. Senha incorreta
- Verifique se a senha no .env está correta
- Teste a conexão: `mysql -u comunikapp -p`

### 3. Usuário não existe
```sql
CREATE USER 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Banco não existe
```sql
CREATE DATABASE comunikapp;
```

## 🚀 COMANDOS COMPLETOS

```bash
# 1. Navegar para o backend
cd backend

# 2. Executar setup automático
npm run setup

# 3. Configurar MySQL (se necessário)
mysql -u root -p
CREATE DATABASE comunikapp;
CREATE USER 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
exit;

# 4. Atualizar .env com as credenciais corretas
# Editar: DATABASE_URL="mysql://comunikapp:password@localhost:3306/comunikapp"

# 5. Gerar cliente Prisma
npx prisma generate

# 6. Executar migrações
npx prisma migrate dev

# 7. Iniciar aplicação
npm run start:dev
```

## 📞 SUPORTE

Se ainda tiver problemas:

1. **Verificar logs do MySQL:**
```bash
# Windows
tail -f "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err"

# Linux/macOS
sudo tail -f /var/log/mysql/error.log
```

2. **Testar conexão direta:**
```bash
mysql -u comunikapp -p -h localhost -P 3306 comunikapp
```

3. **Verificar porta:**
```bash
netstat -an | grep 3306
```

## 🎯 RESULTADO ESPERADO

Após seguir os passos, você deve ver:
```
✅ Conexão com banco de dados OK
✅ Migrações executadas com sucesso
✅ Aplicação rodando em http://localhost:3001
```
