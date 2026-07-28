import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

/**
 * Proxy BFF → Nest.
 * Auth: Bearer (legado) e/ou cookie HttpOnly `comunikapp_session`.
 */
export async function proxyBackend(
  request: NextRequest,
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');

    const hasBearer =
      !!authHeader &&
      authHeader.toLowerCase().startsWith('bearer ') &&
      authHeader.slice(7).trim() !== '' &&
      authHeader.slice(7).trim() !== 'cookie-session';

    if (!hasBearer && !cookieHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 },
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (hasBearer && authHeader) {
      headers.Authorization = authHeader;
    }
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const response = await fetch(buildApiUrl(path), {
      ...init,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Erro na API route proxy ${path}:`, error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
