import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/auth-cookie';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  try {
    const response = await fetch(
      `${getBackendBaseUrl()}/admin/v1/store-user-invitations/validate?token=${encodeURIComponent(token)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível validar o convite.' },
      { status: 502 },
    );
  }
}
