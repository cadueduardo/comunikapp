import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  getBackendBaseUrl,
  getSessionCookieOptions,
} from '@/lib/auth-cookie';
import { extractTenantSlugFromHost } from '@/lib/tenant-host';

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const slug = extractTenantSlugFromHost(request.headers.get('host'));
    const body = slug ? { ...raw, slug } : raw;

    const response = await fetch(`${getBackendBaseUrl()}/lojas/login/2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as {
      access_token?: string;
      message?: string;
      user?: unknown;
    };

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    if (!data.access_token || typeof data.access_token !== 'string') {
      return NextResponse.json(
        { message: 'Resposta de login 2FA inválida do servidor.' },
        { status: 502 },
      );
    }

    const { access_token: _omit, ...safe } = data;
    const res = NextResponse.json(
      {
        ...safe,
        ok: true,
        message: data.message || 'Login realizado com sucesso!',
      },
      { status: 200 },
    );
    res.cookies.set(
      SESSION_COOKIE_NAME,
      data.access_token,
      getSessionCookieOptions(
        undefined,
        request.headers.get('x-forwarded-host') || request.headers.get('host'),
      ),
    );
    return res;
  } catch (error) {
    console.error('POST /api/auth/login/2fa:', error);
    return NextResponse.json(
      { message: 'Erro interno ao verificar 2FA.' },
      { status: 500 },
    );
  }
}
