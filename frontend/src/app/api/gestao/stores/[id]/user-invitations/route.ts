import { NextRequest } from 'next/server';
import { proxyAdminBackend } from '@/lib/api/proxy-admin-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAdminBackend(
    request,
    `/admin/v1/stores/${encodeURIComponent(id)}/user-invitations`,
    { method: 'GET' },
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyAdminBackend(
    request,
    `/admin/v1/stores/${encodeURIComponent(id)}/user-invitations`,
    { method: 'POST', body },
  );
}
