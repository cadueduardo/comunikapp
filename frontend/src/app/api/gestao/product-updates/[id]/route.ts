import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyAdminBackend(
    request,
    `/admin/v1/product-updates/${encodeURIComponent(id)}`,
    { method: 'GET' },
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyAdminBackend(
    request,
    `/admin/v1/product-updates/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: await request.text() },
  );
}
