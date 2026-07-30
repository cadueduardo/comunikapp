import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyBackend(request, `/expedicao/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: body || undefined,
  });
}
