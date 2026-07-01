# Configuração do Google Drive — passo a passo

**Versão:** 1.0  
**Data:** 2026-06-30  
**Relacionado:** [04-hub-conexoes-google-drive.md](./04-hub-conexoes-google-drive.md), [03-arte-cliente-fila-preflight-e-storage-drive.md](./03-arte-cliente-fila-preflight-e-storage-drive.md)

Este guia explica como configurar o **servidor** (variáveis `.env`) e o **Google Cloud Console** para que cada loja conecte o Drive em **Configurações → Conexões** e o módulo de Arte faça upload dos arquivos na conta Google da loja.

---

## Visão geral

| Camada | O que configura | Onde |
|--------|-----------------|------|
| **Plataforma (uma vez)** | Credenciais OAuth do app Comunikapp | Google Cloud Console + `.env` do backend |
| **Por loja** | Conta Google que receberá os arquivos | `/configuracoes/conexoes` no frontend |
| **E-mail de cobrança** (opcional) | SMTP para “Solicitar arte ao cliente” | `.env` do backend (`SMTP_*` ou `MAIL_*`) |

O upload de arte **exige** Google Drive conectado na loja. Sem isso, o backend retorna erro ao enviar arquivo.

---

## 1. Pré-requisitos

- Acesso de administrador ao projeto no [Google Cloud Console](https://console.cloud.google.com/)
- Backend Comunikapp rodando com migrations aplicadas (`loja_conexao`, etc.)
- URL pública do backend em produção (para o redirect OAuth)
- Conta Google da **loja** (não do cliente final) — recomenda-se conta dedicada ou Drive compartilhado da empresa

---

## 2. Google Cloud Console

### 2.1 Criar ou selecionar projeto

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/)
2. Crie um projeto (ex.: `Comunikapp Produção`) ou selecione um existente

### 2.2 Ativar a API do Google Drive

1. Menu **APIs e serviços** → **Biblioteca**
2. Pesquise **Google Drive API**
3. Clique em **Ativar**

Opcional (já usada no fluxo OAuth): **Google People API** ou permissões de perfil via OAuth2 userinfo — o escopo `userinfo.email` cobre e-mail/nome na conexão.

### 2.3 Tela de consentimento OAuth

1. **APIs e serviços** → **Tela de consentimento OAuth**
2. Tipo de usuário:
   - **Interno** — se todos os usuários são do mesmo Workspace Google
   - **Externo** — uso geral (lojas com Gmail/Workspace variados)
3. Preencha nome do app, e-mail de suporte e domínios autorizados (em produção: `comunikapp.com.br`)
4. Em **Escopos**, adicione (ou confirme após criar credenciais):
   - `.../auth/drive.file` — arquivos criados pelo app
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Se **Externo**, publique o app ou adicione usuários de teste até a verificação Google (em dev, contas de teste bastam)

### 2.4 Credenciais OAuth 2.0

1. **APIs e serviços** → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**
2. Tipo: **Aplicativo da Web**
3. **URIs de redirecionamento autorizados** — adicione **todas** as URLs de callback do **backend**:

| Ambiente | URI de redirect (exemplo) |
|----------|---------------------------|
| Desenvolvimento local | `http://localhost:4000/conexoes/google/callback` |
| Produção (API direta) | `https://api.seudominio.com.br/conexoes/google/callback` |
| Produção (prefixo `/api`) | `https://api.seudominio.com.br/api/conexoes/google/callback` |

Use exatamente a mesma URL que você colocar em `GOOGLE_OAUTH_REDIRECT_URI` no `.env`. Diferença de barra final, `http` vs `https` ou porta quebra o OAuth.

4. Salve e anote **ID do cliente** e **Chave secreta do cliente**

---

## 3. Variáveis no `.env` do backend

Edite `backend/.env` (não commite secrets reais). Reinicie o processo do backend após alterar.

### 3.1 OAuth Google (obrigatório para Drive)

```env
# Credenciais do passo 2.4
GOOGLE_OAUTH_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxx

# Deve ser IDÊNTICA a uma URI cadastrada no Console
# Desenvolvimento:
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/conexoes/google/callback

# Para onde o usuário volta após autorizar no Google
FRONTEND_URL=http://localhost:3000
```

**Produção (exemplo):**

```env
GOOGLE_OAUTH_REDIRECT_URI=https://api.comunikapp.com.br/conexoes/google/callback
FRONTEND_URL=https://comunikapp.com.br
```

Se o Nginx expõe o backend em `https://api.../api/...`, alinhe redirect no Console **e** no `.env` com o path real que o Nest recebe (verifique com `curl` qual rota responde).

### 3.2 Criptografia do refresh token (recomendado)

O refresh token do Google é salvo criptografado em `loja_conexao.configuracao_json`.

```env
# 32+ caracteres aleatórios; NÃO reutilize em repositório público
SECRETS_ENCRYPTION_KEY=sua-chave-aleatoria-longa-aqui
```

Se omitida, o sistema usa `ENCRYPTION_KEY` ou `JWT_SECRET` como fallback — funciona em dev, mas em produção use chave dedicada.

### 3.3 JWT (já existente)

O state do OAuth é assinado com o mesmo `JWT_SECRET` do app:

```env
JWT_SECRET=dev-jwt-secret-minimo-32-caracteres-ci
```

### 3.4 SMTP — e-mail “Solicitar arte ao cliente” (opcional)

Sem SMTP, em desenvolvimento os e-mails vão para conta **Ethereal** (preview no log do backend). Em produção configure:

```env
SMTP_HOST=smtp.seuprovedor.com
SMTP_PORT=587
SMTP_USER=arte@suadominio.com.br
SMTP_PASS=senha-ou-app-password
SMTP_FROM="ComunikApp" <arte@suadominio.com.br>
```

Alternativa legada aceita pelo código: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`.

### 3.5 Resumo rápido

| Variável | Obrigatória para Drive | Descrição |
|----------|------------------------|-----------|
| `GOOGLE_OAUTH_CLIENT_ID` | Sim | Client ID do Console |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Sim | Client secret |
| `GOOGLE_OAUTH_REDIRECT_URI` | Sim | Callback no **backend** |
| `FRONTEND_URL` | Sim | Redirect pós-OAuth para `/configuracoes/conexoes` |
| `JWT_SECRET` | Sim | Já usado pelo auth |
| `SECRETS_ENCRYPTION_KEY` | Recomendado | Criptografia do refresh token |
| `SMTP_*` / `MAIL_*` | Só para e-mail real | Cobrança manual de arte |

---

## 4. Conectar o Drive na loja (interface)

1. Faça login no Comunikapp com usuário da loja
2. Acesse **Configurações** → **Conexões** (`/configuracoes/conexoes`)
3. No card **Google Drive**, clique em **Conectar**
4. Autorize com a conta Google da loja (a que deve receber as pastas `Comunikapp/...`)
5. Ao concluir, você volta para Conexões com toast de sucesso e status **Conectado** (e-mail da conta exibido no card)

**Desconectar:** mesmo card → **Desconectar** (remove tokens da loja; arquivos já no Drive permanecem).

### O que acontece no servidor

- Callback: `GET /conexoes/google/callback` (rota pública, sem JWT)
- Cria pasta raiz `Comunikapp` no Drive da conta conectada
- Salva `refresh_token` criptografado em `loja_conexao` (`tipo = GOOGLE_DRIVE`)

---

## 5. Uso na arte

Após conectado:

- **Upload** no workspace de arte → arquivo vai para  
  `Comunikapp/{Cliente}/OS-{número}/{produto}/`
- **Colar link** (Google Drive ou URL pública) → registrado na versão; links do Drive são reconhecidos quando possível
- Gestor acessa arquivos pelo Comunikapp; não precisa navegar pastas no Drive

---

## 6. Checklist de validação

### Desenvolvimento local

- [ ] `.env` com as 4 variáveis Google + `FRONTEND_URL`
- [ ] Backend na porta do redirect (ex.: `4000`)
- [ ] Redirect cadastrado no Console = `GOOGLE_OAUTH_REDIRECT_URI`
- [ ] Migration `loja_conexao` aplicada
- [ ] Conectar em `/configuracoes/conexoes` sem erro
- [ ] Upload de arte na OS/workspace conclui com sucesso

### Produção

- [ ] Redirect HTTPS apontando para o backend público
- [ ] `FRONTEND_URL` com domínio real do frontend
- [ ] `SECRETS_ENCRYPTION_KEY` definida e estável (não rotacionar sem migrar tokens)
- [ ] SMTP configurado se for usar cobrança por e-mail
- [ ] Após deploy: rebuild backend + reinício PM2 (não confiar só em `dist/` antigo)

---

## 7. Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| “Integração Google não configurada no servidor” | `.env` incompleto ou backend não reiniciado | Conferir 3 vars OAuth; reiniciar processo |
| `redirect_uri_mismatch` | URI no `.env` ≠ Console | Copiar/colar a mesma URL nos dois lugares |
| “Google não retornou refresh_token” | Reautorização sem `prompt=consent` | Revogar app em [myaccount.google.com/permissions](https://myaccount.google.com/permissions) e conectar de novo |
| Upload de arte falha | Loja sem Drive conectado | Conectar em Configurações → Conexões |
| E-mail de cobrança não chega | SMTP ausente em produção | Configurar `SMTP_*`; em dev ver log Ethereal |
| 502 no callback OAuth | Nginx/PM2 | Validar backend local (`curl http://127.0.0.1:PORT/...`) antes do domínio público |

---

## 8. Segurança

- **Nunca** commite `.env` com `CLIENT_SECRET` ou `SECRETS_ENCRYPTION_KEY`
- Credenciais OAuth são **globais da plataforma**; cada loja autoriza sua própria conta
- Escopo `drive.file` limita o app a arquivos que ele criou (não lê o Drive inteiro)
- Rotacione `GOOGLE_OAUTH_CLIENT_SECRET` no Console se houver vazamento; lojas precisarão reconectar

---

## Changelog

| Data | Versão | Alteração |
|------|--------|-----------|
| 2026-06-30 | 1.0 | Guia operacional de configuração Drive + `.env` + Console |
