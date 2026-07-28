import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie';

/**
 * Obtém o JWT de sessão (cookie HttpOnly comunikapp_session).
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(SESSION_COOKIE_NAME)?.value ||
    cookieStore.get('auth_token')?.value ||
    cookieStore.get('token')?.value ||
    cookieStore.get('jwt')?.value;
  return token || null;
}

/**
 * @deprecated Preferir /api/auth/login (BFF) para setar cookie com Domain correto.
 */
export async function setAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
    ...(process.env.NODE_ENV === 'production'
      ? { domain: '.comunikapp.com.br' }
      : {}),
  });
}

/**
 * Remove o cookie de sessão.
 */
export async function removeAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete('auth_token');
  cookieStore.delete('token');
  cookieStore.delete('jwt');
}

/**
 * Verifica se o usuário está autenticado (cookie de sessão presente).
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}
