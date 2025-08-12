# 🗄️ COMANDOS MYSQL NO POWERSHELL

## 🔧 **SOLUÇÃO RÁPIDA**

### **1. Conectar ao MySQL**
```powershell
mysql -u root -p
```
Digite sua senha quando solicitado.

### **2. Executar comandos SQL**
Depois de conectar, execute cada comando separadamente:

```sql
CREATE DATABASE comunikapp;
```

```sql
CREATE USER 'comunikapp'@'localhost' IDENTIFIED BY 'password';
```

```sql
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
```

```sql
FLUSH PRIVILEGES;
```

```sql
exit;
```

## 🚀 **COMANDOS ALTERNATIVOS**

### **Opção 1: Usando arquivo SQL**
```powershell
# Criar arquivo SQL
@"
CREATE DATABASE IF NOT EXISTS comunikapp;
CREATE USER IF NOT EXISTS 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
"@ | Out-File -FilePath "setup.sql" -Encoding UTF8

# Executar arquivo
mysql -u root -p < setup.sql
```

### **Opção 2: Comandos diretos**
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS comunikapp;"
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'comunikapp'@'localhost' IDENTIFIED BY 'password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

## 🔍 **VERIFICAÇÃO**

### **Testar conexão:**
```powershell
mysql -u comunikapp -p comunikapp
```

### **Verificar bancos:**
```powershell
mysql -u root -p -e "SHOW DATABASES;"
```

### **Verificar usuários:**
```powershell
mysql -u root -p -e "SELECT User, Host FROM mysql.user WHERE User = 'comunikapp';"
```

## ⚠️ **PROBLEMAS COMUNS**

### **1. MySQL não encontrado**
```powershell
# Verificar se MySQL está instalado
mysql --version
```

Se não estiver instalado:
- Baixe em: https://dev.mysql.com/downloads/
- Ou use: `choco install mysql`

### **2. Erro de acesso negado**
```powershell
# Conectar como root
mysql -u root -p

# Ou resetar senha do root
mysql -u root -p -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'nova_senha';"
```

### **3. Porta em uso**
```powershell
# Verificar se MySQL está rodando
netstat -an | findstr 3306

# Iniciar MySQL (Windows)
net start mysql
```

## 📋 **SEQUÊNCIA COMPLETA**

```powershell
# 1. Verificar MySQL
mysql --version

# 2. Conectar como root
mysql -u root -p

# 3. Executar comandos (um por vez):
CREATE DATABASE comunikapp;
CREATE USER 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
exit;

# 4. Testar nova conexão
mysql -u comunikapp -p comunikapp

# 5. Configurar .env
# Editar: DATABASE_URL="mysql://comunikapp:password@localhost:3306/comunikapp"

# 6. Gerar Prisma
npx prisma generate

# 7. Executar migrações
npx prisma migrate dev

# 8. Iniciar aplicação
npm run start:dev
```

## 🎯 **RESULTADO ESPERADO**

Após executar os comandos, você deve ver:
- ✅ Banco `comunikapp` criado
- ✅ Usuário `comunikapp` criado
- ✅ Privilégios concedidos
- ✅ Conexão funcionando
- ✅ Aplicação rodando em http://localhost:3001
