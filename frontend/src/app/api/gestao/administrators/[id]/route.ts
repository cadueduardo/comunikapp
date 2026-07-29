import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminBackend(
    request,
    `/admin/v1/administrators/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body,
    },
  );
}
