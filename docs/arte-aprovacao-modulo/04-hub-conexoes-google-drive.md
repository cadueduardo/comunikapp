# Hub de Conexões — design técnico

**Versão:** 1.0  
**Data:** 2026-06-30  
**Relacionado:** [03-arte-cliente-fila-preflight-e-storage-drive.md](./03-arte-cliente-fila-preflight-e-storage-drive.md)

---

## 1. Modelo `LojaConexao`

Tabela polimórfica por loja:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `loja_id` | FK | Tenant |
| `tipo` | `VARCHAR(32)` | `GOOGLE_DRIVE`, `WHATSAPP_EVOLUTION`, … |
| `status` | `VARCHAR(32)` | `DESCONECTADO`, `CONECTADO`, `PENDENTE`, `ERRO` |
| `configuracao_json` | `JSON` | Metadados + `refresh_token_encrypted` (AES-256-GCM) |

Índice único: `(loja_id, tipo)`.

---

## 2. Variáveis de ambiente (servidor)

```env
# OAuth Google (Console Cloud — credenciais globais do Comunikapp)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:4000/conexoes/google/callback

# Redirect após OAuth
FRONTEND_URL=http://localhost:3000

# Criptografia de tokens (preferir chave dedicada)
SECRETS_ENCRYPTION_KEY=
```

Em produção, `GOOGLE_OAUTH_REDIRECT_URI` deve apontar para a URL pública do **backend** (ex.: `https://api.comunikapp.com.br/conexoes/google/callback`).

---

## 3. Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/conexoes` | JWT | Lista integrações (sem segredos) |
| `GET` | `/conexoes/google/auth` | JWT | Retorna `{ url }` para OAuth |
| `GET` | `/conexoes/google/callback` | Público | Callback Google → salva token → redirect frontend |
| `DELETE` | `/conexoes/google` | JWT | Desconecta Drive da loja |

---

## 4. Upload de arte

- Multer `memoryStorage` — sem disco local.
- `ArteStorageService` → `GoogleDriveStorageService.uploadBuffer/stream`.
- Pastas: `Comunikapp/{Cliente}/OS-{numero}/{produto}/` (`ItemOS.arte_drive_folder_id`).
- `ArteArquivo.storage_provider = google_drive`, `storage_path = drive_file_id`.
- `url_arquivo` = `webViewLink` da API oficial.

**Pré-requisito:** Google Drive conectado em `/configuracoes/conexoes`.

---

## 5. Frontend

- Hub: `/configuracoes/conexoes`
- Componente: `ConexaoIntegracaoCard` (reutilizável)
- API proxy: `/api/conexoes/*`

---

## 6. Arquivos implementados

| Área | Caminho |
|------|---------|
| Schema | `backend/prisma/schema.prisma` → `LojaConexao` |
| Módulo Nest | `backend/src/conexoes/` |
| Criptografia | `backend/src/common/services/field-encryption.service.ts` |
| Storage arte | `backend/src/modules/arte-aprovacao/services/arte-storage.service.ts` |
| Pastas Drive | `backend/src/modules/arte-aprovacao/services/arte-drive-folder.service.ts` |
| Hub UI | `frontend/src/app/(main)/configuracoes/conexoes/page.tsx` |
