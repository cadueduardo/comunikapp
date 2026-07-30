import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string }> },
) {
  const { osId } = await params;
  const body = await request.text();
  return proxyBackend(request, `/pcp/kanban/status/${encodeURIComponent(osId)}`, {
    method: 'PUT',
    body: body || undefined,
  });
}
