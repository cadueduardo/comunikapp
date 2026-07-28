import { SESSION_COOKIE_NAME } from './session-cookie';

type HandshakeLike = {
  auth?: { token?: string };
  headers?: {
    authorization?: string;
    cookie?: string | string[];
  };
  query?: Record<string, string | string[] | undefined>;
};

function parseCookieHeader(
  cookieHeader: string | string[] | undefined,
): Record<string, string> {
  if (!cookieHeader) return {};
  const raw = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader;
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

/**
 * Extrai JWT do handshake Socket.IO:
 * 1) auth.token / query.token (legado + link público)
 * 2) Authorization Bearer
 * 3) cookie HttpOnly comunikapp_session (withCredentials)
 */
export function extractJwtFromSocketHandshake(
  handshake: HandshakeLike,
): string | null {
  const fromAuth =
    typeof handshake.auth?.token === 'string'
      ? handshake.auth.token.trim()
      : '';
  if (fromAuth && fromAuth !== 'null' && fromAuth !== 'undefined') {
    return fromAuth;
  }

  const queryToken = handshake.query?.token;
  const fromQuery = Array.isArray(queryToken) ? queryToken[0] : queryToken;
  if (
    typeof fromQuery === 'string' &&
    fromQuery.trim() &&
    fromQuery !== 'null' &&
    fromQuery !== 'undefined'
  ) {
    return fromQuery.trim();
  }

  const authHeader = handshake.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (
      bearer &&
      bearer !== 'null' &&
      bearer !== 'undefined' &&
      bearer !== 'cookie-session'
    ) {
      return bearer;
    }
  }

  const cookies = parseCookieHeader(handshake.headers?.cookie);
  const fromCookie = cookies[SESSION_COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie.trim()) {
    return fromCookie.trim();
  }

  return null;
}

/** Origins permitidos para Socket.IO com credentials (não pode ser *). */
export function getSocketCorsOrigins(): string[] | boolean {
  const isProd = process.env.NODE_ENV === 'production';
  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const defaults = [
    'https://comunikapp.com.br',
    'https://www.comunikapp.com.br',
  ];
  const frontend = process.env.FRONTEND_URL?.trim();
  const dev = isProd
    ? []
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ];
  const list = [
    ...dev,
    ...defaults,
    ...(frontend ? [frontend.replace(/\/$/, '')] : []),
    ...envOrigins,
  ];
  return [...new Set(list)];
}
