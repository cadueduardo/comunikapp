import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyAdminBackend(
    request,
    `/admin/v1/stores${query ? `?${query}` : ''}`,
    { method: 'GET' },
  );
}

