import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

/** Deve coincidir com backend/src/auth/session-cookie.ts */
export const SESSION_COOKIE_NAME = 'comunikapp_session';

/** JWT do Nest: expiresIn 24h */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Opções do cookie HttpOnly.
 * Em produção: Domain=.comunikapp.com.br para cobrir api.comunikapp.com.br (same-site).
 * Em localhost: host-only (sem Domain).
 */
export function getSessionCookieOptions(
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS,
): Partial<ResponseCookie> {
  const isProd = isProductionRuntime();
  const options: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };

  if (isProd) {
    options.domain = '.comunikapp.com.br';
  }

  return options;
}

export function getClearSessionCookieOptions(): Partial<ResponseCookie> {
  return {
    ...getSessionCookieOptions(0),
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
