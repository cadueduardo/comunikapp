# 📧 Configuração SMTP para Notificações

## 🔧 Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env` no backend:

```env
# Configurações SMTP para Notificações
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="noreply@comunikapp.com"

# URL do Frontend (para links nos emails)
FRONTEND_URL="http://localhost:3000"
```

## 📋 Configuração por Provedor

### **Gmail (Recomendado)**

1. **Ative a verificação em 2 etapas** na sua conta Google
2. **Gere uma senha de app**:
   - Vá para [myaccount.google.com](https://myaccount.google.com)
   - Segurança → Verificação em 2 etapas → Senhas de app
   - Gere uma senha para "Outro (nome personalizado)"
   - Use essa senha como `SMTP_PASS`

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app-gerada"
SMTP_FROM="noreply@comunikapp.com"
```

### **Outlook/Hotmail**

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="seu-email@outlook.com"
SMTP_PASS="sua-senha"
SMTP_FROM="noreply@comunikapp.com"
```

### **Yahoo**

```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_USER="seu-email@yahoo.com"
SMTP_PASS="sua-senha-de-app"
SMTP_FROM="noreply@comunikapp.com"
```

### **Servidor SMTP Personalizado**

```env
SMTP_HOST="smtp.seudominio.com"
SMTP_PORT="587"
SMTP_USER="noreply@seudominio.com"
SMTP_PASS="sua-senha"
SMTP_FROM="noreply@seudominio.com"
```

## 🧪 Testando a Configuração

### **1. Teste via API**

```bash
# Testar conexão SMTP
curl -X GET "http://localhost:4000/arte-aprovacao/notificacoes/testar-smtp" \
  -H "Authorization: Bearer SEU_TOKEN"

# Enviar email de teste
curl -X POST "http://localhost:4000/arte-aprovacao/notificacoes/testar-email" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"destinatario": "seu-email@teste.com"}'
```

### **2. Teste no Frontend**

1. Acesse uma OS com arte
2. Gere um link de aprovação
3. Verifique se o email foi enviado para o cliente

## 📧 Templates de Email

O sistema inclui templates responsivos para:

- ✅ **Nova Versão**: Notifica cliente sobre nova arte
- 🔗 **Aprovação Solicitada**: Link para aprovação
- 🎉 **Arte Aprovada**: Confirmação para designer
- 📝 **Alterações Solicitadas**: Feedback para designer
- 💬 **Novo Comentário**: Notificação de comentário

## 🔒 Segurança

- ✅ **Senhas de app** ao invés de senhas normais
- ✅ **Conexões TLS/SSL** para criptografia
- ✅ **Validação de destinatários** antes do envio
- ✅ **Rate limiting** para evitar spam

## 🚨 Solução de Problemas

### **Erro: "Invalid login"**
- Verifique se a verificação em 2 etapas está ativa
- Use senha de app, não a senha normal

### **Erro: "Connection timeout"**
- Verifique as configurações de firewall
- Teste a conectividade com o servidor SMTP

### **Erro: "Authentication failed"**
- Verifique se `SMTP_USER` e `SMTP_PASS` estão corretos
- Para Gmail, certifique-se de usar senha de app

### **Emails não chegam**
- Verifique a pasta de spam/lixo eletrônico
- Confirme se o domínio do remetente não está bloqueado

## 📊 Monitoramento

O sistema registra logs de envio de emails:

```
📧 Email enviado: <message-id>
❌ Erro ao enviar email: [detalhes do erro]
```

Verifique os logs do backend para monitorar o status das notificações.

