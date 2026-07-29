import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyAdminBackend(
    request,
    `/admin/v1/product-updates/${encodeURIComponent(id)}/publish`,
    { method: 'POST' },
  );
}
