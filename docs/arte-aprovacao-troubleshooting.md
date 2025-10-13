# 🔧 Arte & Aprovação - Troubleshooting

## ❌ **"Upload não funciona"**

### **Correções Aplicadas:**

1. **✅ Corrigido extração do nome do thumbnail**
   - Problema: URL do thumbnail estava incorreta
   - Solução: Extrair corretamente o nome do arquivo do path completo

2. **✅ Melhorado logging**
   - Adicionado logs detalhados no controller
   - Mostra: path, filename, thumbnail, URLs geradas

### **Como Verificar se Está Funcionando:**

#### **1. Verificar Backend:**

```bash
# Ver se backend está rodando
netstat -ano | findstr :4000

# Se não estiver, iniciar:
cd backend
npm run start:dev
```

#### **2. Verificar Logs do Backend:**

Ao fazer upload, você deve ver no console do backend:

```
📤 [Controller] Upload de arquivo: {
  versaoId: 'xxx',
  nomeArquivo: 'imagem.jpg',
  tamanho: 123456,
  path: 'C:\\...\\uploads\\arte\\xxx\\12345-imagem.jpg',
  lojaId: 'xxx'
}

✅ [Controller] Arquivo salvo: {
  path: 'C:\\...\\uploads\\arte\\xxx\\12345-imagem.jpg',
  filename: '12345-imagem.jpg',
  thumbnail: 'C:\\...\\uploads\\arte\\xxx\\thumb_12345-imagem.jpg',
  thumbnailFilename: 'thumb_12345-imagem.jpg',
  url_arquivo: '/api/arte-aprovacao/versoes/xxx/arquivos/download/12345-imagem.jpg',
  url_thumbnail: '/api/arte-aprovacao/versoes/xxx/arquivos/download/thumb_12345-imagem.jpg'
}

✅ Arquivo adicionado com sucesso: xxx
```

#### **3. Verificar Pasta de Uploads:**

```bash
# Verificar se pasta foi criada
dir backend\uploads\arte

# Deve ter subpastas por versão:
backend\uploads\arte\[versaoId]\
  - [timestamp]-[nome].jpg
  - thumb_[timestamp]-[nome].jpg
```

#### **4. Verificar Console do Navegador:**

Abra o DevTools (F12) e vá para a aba Console. Ao fazer upload, você deve ver:

```
📤 [API Route] Upload de arquivo para versão: xxx
✅ [API Route] Arquivo enviado: xxx
```

Se houver erro, você verá:
```
❌ [API Route] Erro do backend: { message: "..." }
```

#### **5. Verificar Network (Rede):**

No DevTools, vá para a aba Network:

1. Faça o upload
2. Procure por requisição `upload`
3. Status deve ser `201 Created`
4. Response deve ter:
   ```json
   {
     "id": "xxx",
     "nome_arquivo": "12345-imagem.jpg",
     "url_arquivo": "/api/arte-aprovacao/versoes/xxx/arquivos/download/12345-imagem.jpg",
     "url_thumbnail": "/api/arte-aprovacao/versoes/xxx/arquivos/download/thumb_12345-imagem.jpg"
   }
   ```

---

## 🐛 **Possíveis Problemas e Soluções:**

### **Problema 1: "Versão já existe"**

**Causa**: Tentando criar versão com número que já existe

**Solução**: ✅ JÁ CORRIGIDO - Sistema agora calcula automaticamente a próxima versão disponível

---

### **Problema 2: "Arquivo não foi enviado"**

**Sintomas**:
- Toast: "Versão criada, mas nenhum arquivo foi enviado"
- Versão aparece sem arquivos

**Possíveis Causas**:

1. **Backend não está rodando**
   ```bash
   # Verificar
   netstat -ano | findstr :4000
   
   # Se não estiver, iniciar
   cd backend
   npm run start:dev
   ```

2. **Erro de autenticação**
   - Verifique se você está logado
   - Token pode ter expirado
   - Faça logout e login novamente

3. **Erro de permissão de pasta**
   - Backend não consegue criar pasta `uploads/arte`
   - Solução: Criar manualmente ou verificar permissões

4. **Arquivo muito grande**
   - Limite: 50MB
   - Solução: Reduzir tamanho do arquivo

5. **Tipo de arquivo não permitido**
   - Permitidos: PDF, JPG, PNG, AI, PSD, EPS
   - Solução: Converter arquivo

---

### **Problema 3: "Thumbnail não aparece"**

**Possíveis Causas**:

1. **Arquivo não é imagem**
   - Thumbnails só são gerados para JPG, PNG, WEBP, GIF
   - PDFs e outros mostram ícone genérico

2. **Sharp não instalado**
   ```bash
   cd backend
   npm install sharp
   ```

3. **Erro ao gerar thumbnail**
   - Verificar logs do backend
   - Pode ser imagem corrompida

---

### **Problema 4: "Download não funciona"**

**Possíveis Causas**:

1. **Arquivo não foi salvo**
   - Verificar pasta `backend/uploads/arte/[versaoId]/`

2. **URL incorreta**
   - Verificar se URL tem formato: `/api/arte-aprovacao/versoes/[versaoId]/arquivos/download/[filename]`

3. **Rota Next.js não existe**
   - Verificar se arquivo existe: `frontend/src/app/api/arte-aprovacao/versoes/[versaoId]/arquivos/download/[filename]/route.ts`

---

## 🧪 **Teste Manual Completo:**

### **Passo 1: Preparar Ambiente**

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend (se não estiver rodando)
cd frontend
npm run dev
```

### **Passo 2: Fazer Login**

1. Acesse: `http://localhost:3000/login`
2. Faça login
3. Verifique token no localStorage (F12 > Application > Local Storage)

### **Passo 3: Acessar Arte & Aprovação**

1. Acesse: `http://localhost:3000/os/[id]?tab=arte-aprovacao`
2. Selecione um produto (chip)

### **Passo 4: Criar Nova Versão**

1. Clique em "+ Nova Versão"
2. Arraste uma imagem JPG ou PNG (< 50MB)
3. Preencha descrição (opcional)
4. Clique em "Criar Versão"

### **Passo 5: Verificar Resultado**

**✅ Sucesso se:**
- Toast: "Versão v5 criada com 1 arquivo(s)!"
- Versão aparece na lista
- Thumbnail aparece no preview
- Arquivo aparece na lista de arquivos
- Botão de download funciona

**❌ Erro se:**
- Toast: "Erro ao criar versão" ou "Nenhum arquivo foi enviado"
- Versão não aparece
- Sem thumbnail
- Sem arquivos

---

## 📝 **Checklist de Verificação:**

Antes de reportar problema, verifique:

- [ ] Backend está rodando na porta 4000
- [ ] Frontend está rodando na porta 3000
- [ ] Você está logado no sistema
- [ ] Token não expirou (refaça login)
- [ ] Arquivo é JPG, PNG ou PDF
- [ ] Arquivo tem menos de 50MB
- [ ] Pasta `backend/uploads/arte` existe
- [ ] Console do navegador não mostra erros
- [ ] Console do backend não mostra erros
- [ ] Network mostra status 201 no upload

---

## 🆘 **Se Nada Funcionar:**

1. **Limpar tudo e recomeçar:**

```bash
# Matar processos
taskkill /F /IM node.exe

# Limpar node_modules e reinstalar
cd backend
rm -rf node_modules
npm install

cd ../frontend
rm -rf node_modules
npm install

# Reiniciar
cd ../backend
npm run start:dev

# Em outro terminal
cd ../frontend
npm run dev
```

2. **Verificar versões:**

```bash
node --version  # Deve ser >= 18
npm --version   # Deve ser >= 9
```

3. **Verificar banco de dados:**

```bash
cd backend
npx prisma studio
# Verificar se tabelas arte_versoes e arte_arquivos existem
```

---

## 📊 **Status Atual:**

### **✅ Implementado e Funcionando:**
- Configuração Multer
- Geração de thumbnails
- Endpoint de upload
- Endpoint de download
- Preview no frontend
- Botão de download

### **🐛 Bugs Corrigidos:**
- ✅ Cálculo de próxima versão
- ✅ Extração de nome do thumbnail
- ✅ URLs de download
- ✅ BigInt serialization

### **⏳ Próximas Melhorias:**
- Barra de progresso durante upload
- Preview de PDFs
- Comparação de versões
- Aprovação externa

---

**Se o problema persistir, me envie:**
1. Console do navegador (F12)
2. Console do backend
3. Network tab (requisição de upload)
4. Screenshot do erro



