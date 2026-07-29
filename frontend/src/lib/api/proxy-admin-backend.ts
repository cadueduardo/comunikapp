import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/auth-cookie';

export async function proxyAdminBackend(
  request: NextRequest,
  path: string,
  init?: RequestInit,
): Promise<NextResponse> {
  try {
    const headers = new Headers(init?.headers);
    headers.set('Accept', 'application/json');
    if (init?.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('Cookie', cookie);

    const correlationId = request.headers.get('x-correlation-id');
    if (correlationId) {
      headers.set('x-correlation-id', correlationId);
    }

    const response = await fetch(
      `${getBackendBaseUrl()}${path}`,
      {
        ...init,
        headers,
        cache: 'no-store',
      },
    );
    const data = await response.json().catch(() => ({}));
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      nextResponse.headers.append('set-cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error(`Falha no proxy administrativo ${path}:`, error);
    return NextResponse.json(
      { message: 'Não foi possível conectar à Gestão.' },
      { status: 502 },
    );
  }
}

