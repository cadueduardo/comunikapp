import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const response = await fetch(
      `${getBackendBaseUrl()}/admin/v1/store-user-invitations/accept`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body,
        cache: 'no-store',
      },
    );
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Não foi possível aceitar o convite.' },
      { status: 502 },
    );
  }
}
