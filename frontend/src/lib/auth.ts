import { cookies } from 'next/headers';

/**
 * Obtém o token de autenticação dos cookies
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || 
                cookieStore.get('token')?.value ||
                cookieStore.get('jwt')?.value;
  return token || null;
}

/**
 * Define o token de autenticação nos cookies
 */
export async function setAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 dias
  });
}

/**
 * Remove o token de autenticação dos cookies
 */
export async function removeAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('token');
  cookieStore.delete('jwt');
}

/**
 * Verifica se o usuário está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}





