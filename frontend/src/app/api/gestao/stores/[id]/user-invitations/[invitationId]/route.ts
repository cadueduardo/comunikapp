import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; invitationId: string }> },
) {
  const { id, invitationId } = await params;
  return proxyAdminBackend(
    request,
    `/admin/v1/stores/${encodeURIComponent(id)}/user-invitations/${encodeURIComponent(invitationId)}`,
    { method: 'DELETE' },
  );
}
