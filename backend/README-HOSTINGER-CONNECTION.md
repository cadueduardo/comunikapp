# 🔗 CONEXÃO COM BANCO MYSQL HOSTINGER

## 📋 **PRÉ-REQUISITOS**

### **1. Acesso Remoto Configurado na Hostinger**
- Acesse o painel da Hostinger
- Vá em **Sites → Gerenciar → MySQL Remoto**
- Configure o acesso remoto para seu IP ou "Qualquer Host" (%)
- **Anote o hostname do servidor MySQL** (está na parte superior da seção)

### **2. Credenciais do Banco**
- **Database:** u849952347_comunikapp
- **Username:** u849952347_comunikapp
- **Password:** C@du27140797130622
- **Port:** 3306

## 🚀 **CONFIGURAÇÃO AUTOMÁTICA**

### **PASSO 1: Executar Configurador**
```bash
# Substitua "SEU_HOSTNAME_AQUI" pelo hostname real da Hostinger
node configure-hostinger-db.js "SEU_HOSTNAME_AQUI"
```

**Exemplo:**
```bash
node configure-hostinger-db.js "sql123.hostinger.com"
```

### **PASSO 2: Verificar Conexão**
```bash
# Testar conexão com hostname específico
node test-hostinger-connection.js "SEU_HOSTNAME_AQUI"

# Ou testar com configuração atual
node test-hostinger-connection.js
```

## 🔧 **CONFIGURAÇÃO MANUAL**

### **1. Atualizar arquivo .env-catalogo-insumos**
```env
CATALOGO_INSUMOS_DATABASE_URL="mysql://u849952347_comunikapp:C@du27140797130622@SEU_HOSTNAME_AQUI:3306/u849952347_comunikapp"
```

### **2. Testar conexão**
```bash
node test-hostinger-connection.js
```

## 📊 **EXECUTAR MIGRAÇÕES PRISMA**

Após conectar com sucesso:

```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma db push

# Ou criar migração
npx prisma migrate dev --name init-catalogo-insumos
```

## 🧪 **TESTAR MÓDULO COM BANCO REAL**

```bash
# Testar módulo NestJS
npm run start:catalogo

# Ou testar via Swagger
# Acesse: http://localhost:3001/api-docs
```

## 🚨 **PROBLEMAS COMUNS**

### **1. Conexão Recusada**
- ✅ Verificar se o hostname está correto
- ✅ Verificar se o IP está liberado na Hostinger
- ✅ Verificar se a porta 3306 está aberta

### **2. Acesso Negado**
- ✅ Verificar usuário e senha
- ✅ Verificar permissões do usuário
- ✅ Verificar se o banco existe

### **3. Banco Não Encontrado**
- ✅ Verificar nome do banco
- ✅ Verificar se o banco foi criado
- ✅ Verificar permissões de acesso

## 📋 **PRÓXIMOS PASSOS**

1. ✅ **Conectar com banco Hostinger**
2. ⏳ **Executar migrações Prisma**
3. ⏳ **Testar módulo com banco real**
4. ⏳ **Implementar crawler**
5. ⏳ **Coletar dados da web**

## 🔗 **LINKS ÚTEIS**

- [Documentação Hostinger MySQL Remoto](https://support.hostinger.com/pt/articles/1583546-como-configurar-o-acesso-remoto-ao-mysql-no-hostinger)
- [Prisma MySQL Connection](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [MySQL2 Node.js](https://github.com/sidorares/node-mysql2)

---

**🎯 Status:** Aguardando hostname correto da Hostinger  
**📅 Data:** Janeiro 2025  
**👤 Criado por:** Equipe de Desenvolvimento
