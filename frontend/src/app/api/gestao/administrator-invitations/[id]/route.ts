import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params;
  return proxyAdminBackend(
    request,
    `/admin/v1/administrator-invitations/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

