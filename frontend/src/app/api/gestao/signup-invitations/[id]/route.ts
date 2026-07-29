import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyAdminBackend(
    request,
    `/admin/v1/signup-invitations/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
