import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  getBackendBaseUrl,
  getClearSessionCookieOptions,
} from '@/lib/auth-cookie';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const response = await fetch(`${getBackendBaseUrl()}/lojas/me`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        Cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const res = NextResponse.json(data, { status: response.status });
      if (response.status === 401) {
        res.cookies.set(SESSION_COOKIE_NAME, '', getClearSessionCookieOptions());
      }
      return res;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/auth/me:', error);
    return NextResponse.json(
      { message: 'Erro interno ao carregar sessão.' },
      { status: 500 },
    );
  }
}
