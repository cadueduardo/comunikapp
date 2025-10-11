# 🔧 Configuração do Módulo Arte & Aprovação

## 📋 **Variáveis de Ambiente Necessárias**

Para o módulo Arte & Aprovação funcionar corretamente, você precisa adicionar as seguintes variáveis ao arquivo `.env` do backend:

### **1. URL do Frontend**

```env
FRONTEND_URL="http://localhost:3000"
```

**Importante:** Em produção, altere para a URL real do seu frontend:
```env
FRONTEND_URL="https://seu-dominio.com.br"
```

### **2. Configuração SMTP (Notificações por Email)**

```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="ComunikApp <seu-email@gmail.com>"
```

---

## 📧 **Configuração de Email**

### **Opção 1: Gmail (Recomendado para Desenvolvimento)**

1. **Ative a verificação em 2 etapas** na sua conta Google
2. **Gere uma senha de app**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" → "Outro (nome personalizado)"
   - Digite "ComunikApp" e clique em "Gerar"
   - Copie a senha gerada (16 caracteres)

3. **Configure no .env**:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"  # Senha de app gerada
SMTP_FROM="ComunikApp <seu-email@gmail.com>"
```

### **Opção 2: Outlook/Hotmail**

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT=587
SMTP_USER="seu-email@outlook.com"
SMTP_PASS="sua-senha"
SMTP_FROM="ComunikApp <seu-email@outlook.com>"
```

### **Opção 3: Yahoo Mail**

```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT=587
SMTP_USER="seu-email@yahoo.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="ComunikApp <seu-email@yahoo.com>"
```

### **Opção 4: Servidor SMTP Personalizado**

```env
SMTP_HOST="smtp.seu-servidor.com"
SMTP_PORT=587
SMTP_USER="seu-usuario"
SMTP_PASS="sua-senha"
SMTP_FROM="ComunikApp <noreply@seu-dominio.com>"
```

---

## 🚀 **Como Aplicar as Configurações**

### **Passo 1: Copiar o arquivo .env**

```powershell
# No diretório backend/
Copy-Item .env-corrected .env
```

### **Passo 2: Editar o .env**

Abra o arquivo `backend/.env` e adicione/atualize as seguintes linhas:

```env
# App Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="ComunikApp <seu-email@gmail.com>"
```

### **Passo 3: Reiniciar o servidor backend**

```powershell
npm run start:dev
```

---

## ✅ **Testar a Configuração**

### **1. Testar Conexão SMTP**

```bash
curl -X GET http://localhost:4000/arte-aprovacao/notificacoes/test-smtp \
  -H "Authorization: Bearer SEU_TOKEN"
```

### **2. Gerar Link de Aprovação**

No frontend, ao criar uma versão e clicar no botão de "Gerar Link de Aprovação", você deve ver:

✅ **URL correta**:
```
http://localhost:3000/arte/aprovacao/af7a6516-0a08-4793-860f-c82e2b725716
```

❌ **URL incorreta** (sem FRONTEND_URL configurado):
```
undefined/arte/aprovacao/af7a6516-0a08-4793-860f-c82e2b725716
```

---

## 🔍 **Solução de Problemas**

### **Problema: URL aparece como "undefined"**

**Causa:** Variável `FRONTEND_URL` não está configurada no `.env`

**Solução:**
1. Adicione `FRONTEND_URL="http://localhost:3000"` ao arquivo `backend/.env`
2. Reinicie o servidor backend

### **Problema: Emails não estão sendo enviados**

**Causa:** Configuração SMTP incorreta ou senha inválida

**Solução:**
1. Verifique se as credenciais SMTP estão corretas
2. Para Gmail, certifique-se de usar uma **senha de app**, não a senha da conta
3. Teste a conexão SMTP usando o endpoint de teste

### **Problema: Link de aprovação não abre**

**Causa:** URL do frontend incorreta ou página não existe

**Solução:**
1. Verifique se o frontend está rodando em `http://localhost:3000`
2. Acesse manualmente: `http://localhost:3000/arte/aprovacao/[TOKEN]`
3. Verifique se a rota existe em `frontend/src/app/arte/aprovacao/[token]/page.tsx`

---

## 📝 **Exemplo de .env Completo**

```env
# ===== CONFIGURAÇÃO PRINCIPAL DO PROJETO =====

# Database Configuration
DATABASE_URL="mysql://comunikapp:password@localhost:3306/comunikapp"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# App Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# SMTP Configuration (Arte & Aprovação)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM="ComunikApp <seu-email@gmail.com>"

# File Upload Configuration
UPLOAD_DEST="./uploads"
MAX_FILE_SIZE=5242880
```

---

## 🎯 **Próximos Passos**

Após configurar corretamente:

1. ✅ **Reinicie o backend**
2. ✅ **Teste a geração de links**
3. ✅ **Acesse o link público**
4. ✅ **Teste o envio de emails**
5. ✅ **Aprove/Rejeite uma arte**

**Tudo pronto!** 🚀


