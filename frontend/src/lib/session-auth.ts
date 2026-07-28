import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie';

/** Flag não-secreta: só indica ao JS que há sessão HttpOnly ativa. */
export const SESSION_ACTIVE_KEY = 'comunikapp_session_active';

/**
 * Sentinel legado para `if (!token)` após migração HttpOnly.
 * Nunca é um JWT — não deve ir em Authorization (Nest ignora e cai no cookie).
 */
export const COOKIE_SESSION_SENTINEL = 'cookie-session';

export function markClientSessionActive(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_ACTIVE_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearClientSessionActive(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
  } catch {
    // ignore
  }
}

export function hasClientSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SESSION_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Substitui `localStorage.getItem('access_token')` no client.
 * Retorna sentinel se a sessão cookie estiver marcada — não é JWT.
 */
export function getClientSessionToken(): string | null {
  return hasClientSession() ? COOKIE_SESSION_SENTINEL : null;
}

/** Token que pode ir em Authorization: Bearer (JWT ou link público opaco). */
export function isUsableBearerToken(token?: string | null): boolean {
  if (!token) return false;
  if (
    token === 'null' ||
    token === 'undefined' ||
    token === COOKIE_SESSION_SENTINEL
  ) {
    return false;
  }
  return true;
}

export { SESSION_COOKIE_NAME };
