import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  getBackendBaseUrl,
  getSessionCookieOptions,
} from '@/lib/auth-cookie';
import { extractTenantSlugFromHost } from '@/lib/tenant-host';

type NestLoginSuccess = {
  access_token?: string;
  requiresTwoFactor?: boolean;
  temporaryToken?: string;
  message?: string;
  user?: unknown;
};

function omitAccessToken<T extends Record<string, unknown>>(body: T) {
  const { access_token: _token, ...safe } = body;
  return safe;
}

async function forwardLogin(
  path: string,
  body: unknown,
): Promise<{ status: number; data: NestLoginSuccess & Record<string, unknown> }> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as NestLoginSuccess &
    Record<string, unknown>;
  return { status: response.status, data };
}

function applySessionCookie(
  res: NextResponse,
  accessToken: string,
): NextResponse {
  res.cookies.set(
    SESSION_COOKIE_NAME,
    accessToken,
    getSessionCookieOptions(),
  );
  return res;
}

function withTenantSlug(request: NextRequest, body: Record<string, unknown>) {
  const slug = extractTenantSlugFromHost(request.headers.get('host'));
  if (!slug) return body;
  return { ...body, slug };
}

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const body = withTenantSlug(request, raw);
    const { status, data } = await forwardLogin('/lojas/login', body);

    if (!status || status >= 400) {
      return NextResponse.json(data, { status: status || 500 });
    }

    if (data.requiresTwoFactor && data.temporaryToken) {
      return NextResponse.json(
        {
          requiresTwoFactor: true,
          temporaryToken: data.temporaryToken,
          message: data.message,
        },
        { status: 200 },
      );
    }

    if (!data.access_token || typeof data.access_token !== 'string') {
      return NextResponse.json(
        { message: 'Resposta de login inválida do servidor.' },
        { status: 502 },
      );
    }

    const res = NextResponse.json(
      {
        ...omitAccessToken(data),
        ok: true,
        message: data.message || 'Login realizado com sucesso!',
      },
      { status: 200 },
    );
    return applySessionCookie(res, data.access_token);
  } catch (error) {
    console.error('POST /api/auth/login:', error);
    return NextResponse.json(
      { message: 'Erro interno ao autenticar.' },
      { status: 500 },
    );
  }
}
