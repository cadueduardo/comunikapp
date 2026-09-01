import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie';

function extrairJwtDoCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const partes = cookieHeader.split(';');
  let encontrado: string | null = null;
  for (const parte of partes) {
    const [nome, ...rest] = parte.trim().split('=');
    if (nome === SESSION_COOKIE_NAME) {
      const valor = rest.join('=').trim();
      if (!valor || valor === 'null' || valor === 'undefined') continue;
      try {
        encontrado = decodeURIComponent(valor);
      } catch {
        encontrado = valor;
      }
    }
  }
  return encontrado;
}

export type BackendAuthOk = {
  ok: true;
  headers: Record<string, string>;
};

export type BackendAuthFail = {
  ok: false;
  response: NextResponse;
};

/**
 * Resolve Authorization a partir de Bearer válido ou cookie HttpOnly.
 * Use em uploads/binários onde proxyBackend (JSON) não serve.
 */
export function resolveBackendAuth(
  request: NextRequest,
): BackendAuthOk | BackendAuthFail {
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  const jwtDoCookie = extrairJwtDoCookie(cookieHeader);

  const hasBearer =
    !!authHeader &&
    authHeader.toLowerCase().startsWith('bearer ') &&
    authHeader.slice(7).trim() !== '' &&
    authHeader.slice(7).trim() !== 'cookie-session';

  if (!hasBearer && !jwtDoCookie && !cookieHeader) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 },
      ),
    };
  }

  const headers: Record<string, string> = {};

  if (hasBearer && authHeader) {
    headers.Authorization = authHeader;
  } else if (jwtDoCookie) {
    headers.Authorization = `Bearer ${jwtDoCookie}`;
  }

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  for (const nome of ['x-loja-id', 'x-user-roles', 'x-tenant-slug'] as const) {
    const valor = request.headers.get(nome);
    if (valor) {
      headers[nome] = valor;
    }
  }

  return { ok: true, headers };
}

function withQuery(request: NextRequest, path: string): string {
  const qs = request.nextUrl.searchParams.toString();
  if (!qs) return path;
  // Path já trouxe query (legado): não duplicar — Nest/Express transforma
  // chaves repetidas em array e quebra @Query('x') tipado como string.
  if (path.includes('?')) return path;
  return `${path}?${qs}`;
}

export type ProxyBackendOptions = RequestInit & {
  /** Se true, não força Content-Type: application/json (uploads multipart). */
  omitJsonContentType?: boolean;
  /** Se true, não anexa a query string da requisição de entrada. */
  skipForwardQuery?: boolean;
};

/**
 * Proxy BFF → Nest (resposta JSON).
 * Auth: Bearer (legado) e/ou cookie HttpOnly `comunikapp_session`.
 * Encaminha query string da requisição de entrada por padrão.
 */
export async function proxyBackend(
  request: NextRequest,
  path: string,
  init?: ProxyBackendOptions,
): Promise<NextResponse> {
  try {
    const auth = resolveBackendAuth(request);
    if (!auth.ok) return auth.response;

    const { omitJsonContentType, skipForwardQuery, ...fetchInit } = init ?? {};

    const headers: Record<string, string> = {
      ...auth.headers,
      ...(fetchInit.headers as Record<string, string> | undefined),
    };

    if (!omitJsonContentType && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    const targetPath = skipForwardQuery ? path : withQuery(request, path);

    const response = await fetch(buildApiUrl(targetPath), {
      ...fetchInit,
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
