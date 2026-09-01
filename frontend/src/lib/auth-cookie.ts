import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { isCustomTenantHost, stripPort } from '@/lib/tenant-host';

/** Deve coincidir com backend/src/auth/session-cookie.ts */
export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME?.trim() || 'comunikapp_session';

/** JWT do Nest: expiresIn 24h */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Opções do cookie HttpOnly.
 * - Produção em *.comunikapp.com.br: Domain=.comunikapp.com.br (same-site com api.).
 * - UAT (uat.comunikapp.com.br): host-only, para não vazar sessão para produção.
 * - Domínio próprio do cliente: host-only (sem Domain) — same-origin via Nginx.
 * - Localhost: host-only.
 */
export function getSessionCookieOptions(
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS,
  requestHost?: string | null,
): Partial<ResponseCookie> {
  const isProd = isProductionRuntime();
  const options: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };

  const host = stripPort(requestHost || '');
  const isUatApex = host === 'uat.comunikapp.com.br';
  if (isProd && !isCustomTenantHost(requestHost) && !isUatApex) {
    options.domain = '.comunikapp.com.br';
  }

  return options;
}

export function getClearSessionCookieOptions(
  requestHost?: string | null,
): Partial<ResponseCookie> {
  return {
    ...getSessionCookieOptions(0, requestHost),
    maxAge: 0,
  };
}

export function getBackendBaseUrl(): string {
  const fromEnv =
    process.env.BACKEND_URL ||
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL;
  if (fromEnv && /^https?:\/\//.test(fromEnv)) {
    return fromEnv.replace(/\/$/, '');
  }
  return 'http://127.0.0.1:4000';
}

export function hostFromRequestHeaders(
  headers: Headers | { get(name: string): string | null },
): string {
  const xf = headers.get('x-forwarded-host');
  if (xf) return stripPort(xf.split(',')[0]?.trim() || '');
  return stripPort(headers.get('host') || '');
}
