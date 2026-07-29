import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  return proxyAdminBackend(
    request,
    `/admin/v1/auth/invitation?token=${encodeURIComponent(token)}`,
    { method: 'GET' },
  );
}

export async function POST(request: NextRequest) {
  return proxyAdminBackend(
    request,
    '/admin/v1/auth/invitation/accept',
    {
      method: 'POST',
      body: await request.text(),
    },
  );
}

