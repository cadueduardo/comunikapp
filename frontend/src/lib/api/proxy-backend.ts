import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie';

function extrairJwtDoCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const partes = cookieHeader.split(';');
  for (const parte of partes) {
    const [nome, ...rest] = parte.trim().split('=');
    if (nome === SESSION_COOKIE_NAME) {
      const valor = rest.join('=').trim();
      if (!valor || valor === 'null' || valor === 'undefined') return null;
      try {
        return decodeURIComponent(valor);
      } catch {
        return valor;
      }
    }
  }
  return null;
}

/**
 * Proxy BFF → Nest.
 * Auth: Bearer (legado) e/ou cookie HttpOnly `comunikapp_session`.
 * Quando só há cookie, o JWT é reenviado também como Bearer para o Nest
 * (além do Cookie), evitando 401 em rotas BFF que antes exigiam Authorization.
 */
export async function proxyBackend(
  request: NextRequest,
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    const jwtDoCookie = extrairJwtDoCookie(cookieHeader);

    const hasBearer =
      !!authHeader &&
      authHeader.toLowerCase().startsWith('bearer ') &&
      authHeader.slice(7).trim() !== '' &&
      authHeader.slice(7).trim() !== 'cookie-session';

    if (!hasBearer && !jwtDoCookie && !cookieHeader) {
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
    } else if (jwtDoCookie) {
      headers.Authorization = `Bearer ${jwtDoCookie}`;
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
