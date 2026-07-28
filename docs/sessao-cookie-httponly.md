# Sessão JWT em cookie HttpOnly

**Status:** Fatia 1 implementada (2026-07-28)

## Contrato

| Item | Valor |
|---|---|
| Cookie | `comunikapp_session` |
| Flags | `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/` |
| Domain (prod) | `.comunikapp.com.br` (front + `api.`) |
| Domain (dev) | host-only (localhost) |
| Max-Age | 24h (alinhado ao JWT Nest) |

O JWT **não** é mais gravado em `localStorage`.

## Fluxo

1. Browser → `POST /api/auth/login` (Next BFF)
2. Next → Nest `POST /lojas/login`
3. Next seta cookie HttpOnly (omite `access_token` no JSON)
4. Chamadas à API usam `credentials: 'include'`
5. Nest aceita `Authorization: Bearer` **ou** cookie `comunikapp_session`

Rotas BFF: `/api/auth/login`, `/api/auth/login/2fa`, `/api/auth/logout`, `/api/auth/me`

## Fatia 2 (pendente)

- WebSocket (Arte/Expedição/PCP) ainda pode ler `localStorage` em alguns hooks — migrar para cookie/`withCredentials` ou ticket curto.
- Remover leituras pontuais restantes de `access_token` no client.

## Validação rápida

- Login → cookie presente; `localStorage.access_token` ausente
- Refresh da página → sessão mantida via `/api/auth/me`
- Logout → cookie limpo; API retorna 401
- CORS: um único `Access-Control-Allow-Origin` com credentials
