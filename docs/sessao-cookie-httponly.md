# Sessão JWT em cookie HttpOnly

**Status:** Fatia 1 + Fatia 2 (2026-07-28)

## Contrato

| Item | Valor |
|---|---|
| Cookie | `comunikapp_session` |
| Flags | `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/` |
| Domain (prod) | `.comunikapp.com.br` (front + `api.`) |
| Domain (dev) | host-only (localhost) |
| Max-Age | 24h (alinhado ao JWT Nest) |
| Flag client | `sessionStorage.comunikapp_session_active=1` (não é JWT) |

O JWT **não** fica em `localStorage`. Leituras legadas usam `getClientSessionToken()` (sentinel `cookie-session` só para `if (!token)`); `Authorization` só recebe JWT/token de link real.

## Fluxo HTTP

1. Browser → `POST /api/auth/login` (Next BFF)
2. Next → Nest `POST /lojas/login`
3. Next seta cookie HttpOnly (omite `access_token` no JSON)
4. Chamadas à API usam `credentials: 'include'`
5. Nest aceita `Authorization: Bearer` **ou** cookie `comunikapp_session`

Rotas BFF: `/api/auth/login`, `/api/auth/login/2fa`, `/api/auth/logout`, `/api/auth/me`

## WebSocket (Fatia 2)

- Client: `withCredentials: true` (Arte, Expedição, Cálculo)
- Nest: `extractJwtFromSocketHandshake` lê `auth.token`, Bearer **ou** cookie
- CORS do Socket.IO com origins explícitos + `credentials: true` (não `*`)
- Cálculo V2 deriva `lojaId`/`usuarioId` do JWT (não confia só na query)

## Nginx (produção)

O site apex (`comunikapp.com.br`) deve proxyar **todo** `/api/*` same-origin
para o **BFF Next** (`127.0.0.1:3001`), exceto login direto no Nest:

```nginx
location = /api/lojas/login { proxy_pass http://127.0.0.1:4001/lojas/login; ... }
location /api/ { proxy_pass http://127.0.0.1:3001; ... }
```

`api.comunikapp.com.br` continua apontando ao Nest. O **browser** não deve
chamar `api.*` com sessão cookie: use sempre `/api/...` same-origin
(`apiRequest` / `buildApiUrl` forçam isso). `NEXT_PUBLIC_API_URL` em produção
deve ser `/api` (não `https://api.comunikapp.com.br`).

## Tenant hints

`loja_id` / `user_roles` / `user_id` **não** são mais gravados no `localStorage` após `/me`. Tenant vem do JWT no backend.

## Validação rápida

- Login → cookie HttpOnly; sem JWT em `localStorage`
- Refresh → `/api/auth/me` + `session_active`
- Logout → cookie limpo; WS não reconecta
- Socket autenticado sem `auth.token` no browser (só cookie)
- CORS: um único `Access-Control-Allow-Origin` com credentials
