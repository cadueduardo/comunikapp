# 🔧 SOLUÇÃO PARA ERRO PRISMA SHADOW DATABASE

## ❌ **ERRO ATUAL**
```
Error: P3014
Prisma Migrate could not create the shadow database. Please make sure the database user has permission to create databases.
```

## ✅ **SOLUÇÕES**

### **SOLUÇÃO 1: Corrigir Permissões do Usuário**

Execute no MySQL como root:

```sql
-- Conceder permissão para criar bancos de dados
GRANT CREATE ON *.* TO 'comunikapp'@'localhost';

-- Conceder permissões completas no banco comunikapp
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';

-- Conceder permissão para criar bancos temporários
GRANT CREATE TEMPORARY TABLES ON *.* TO 'comunikapp'@'localhost';

-- Conceder permissão para LOCK TABLES
GRANT LOCK TABLES ON comunikapp.* TO 'comunikapp'@'localhost';

-- Conceder permissão para SELECT em INFORMATION_SCHEMA
GRANT SELECT ON INFORMATION_SCHEMA.* TO 'comunikapp'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;
```

### **SOLUÇÃO 2: Usar Root Temporariamente**

Edite o arquivo `.env`:

```env
# Temporariamente usar root para migrações
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/comunikapp"
ESTOQUE_DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/comunikapp"
```

Depois execute:
```powershell
npx prisma migrate dev
```

### **SOLUÇÃO 3: Desabilitar Shadow Database**

Crie um arquivo `prisma/migrations/.env`:

```env
# Desabilitar shadow database
SHADOW_DATABASE_URL=""
```

Ou use a flag:
```powershell
npx prisma migrate dev --skip-shadow-database
```

### **SOLUÇÃO 4: Usar Prisma Push (Alternativa)**

```powershell
# Em vez de migrate dev, use push
npx prisma db push
```

## 🚀 **COMANDOS COMPLETOS**

### **Opção 1: Corrigir Permissões**

```powershell
# 1. Executar script de permissões
.\fix-prisma-permissions.ps1

# 2. Conectar ao MySQL e executar comandos
mysql -u root -p < fix_permissions.sql

# 3. Testar migrações
npx prisma migrate dev
```

### **Opção 2: Usar Root**

```powershell
# 1. Editar .env para usar root
# DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/comunikapp"

# 2. Executar migrações
npx prisma migrate dev

# 3. Voltar para usuário comunikapp
# DATABASE_URL="mysql://comunikapp:password@localhost:3306/comunikapp"
```

### **Opção 3: Skip Shadow Database**

```powershell
# Executar sem shadow database
npx prisma migrate dev --skip-shadow-database
```

## 🔍 **VERIFICAÇÃO**

### **Testar permissões:**
```sql
SHOW GRANTS FOR 'comunikapp'@'localhost';
```

### **Testar conexão:**
```powershell
npx prisma db pull
```

### **Testar migrações:**
```powershell
npx prisma migrate dev
```

## ⚠️ **PROBLEMAS COMUNS**

### **1. Usuário não existe**
```sql
CREATE USER 'comunikapp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON comunikapp.* TO 'comunikapp'@'localhost';
FLUSH PRIVILEGES;
```

### **2. Banco não existe**
```sql
CREATE DATABASE IF NOT EXISTS comunikapp;
```

### **3. Senha incorreta**
```sql
ALTER USER 'comunikapp'@'localhost' IDENTIFIED BY 'nova_senha';
FLUSH PRIVILEGES;
```

## 📋 **SEQUÊNCIA RECOMENDADA**

```powershell
# 1. Corrigir permissões
.\fix-prisma-permissions.ps1

# 2. Executar comandos SQL
mysql -u root -p < fix_permissions.sql

# 3. Gerar cliente Prisma
npx prisma generate

# 4. Executar migrações
npx prisma migrate dev

# 5. Testar aplicação
npm run start:dev
```

## 🎯 **RESULTADO ESPERADO**

Após resolver:
- ✅ Usuário `comunikapp` com permissões corretas
- ✅ Shadow database funcionando
- ✅ Migrações executadas com sucesso
- ✅ Aplicação rodando normalmente
- ✅ Módulo de estoque 100% funcional

## 📞 **SUPORTE**

Se ainda tiver problemas:
1. Use `npx prisma db push` em vez de `migrate dev`
2. Use root temporariamente para migrações
3. Desabilite shadow database com `--skip-shadow-database`
4. Verifique se o MySQL está configurado corretamente
