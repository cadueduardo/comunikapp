import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setorId: string }> },
) {
  const { setorId } = await params;
  return proxyBackend(request, `/pcp/kanban/fila-setor/${encodeURIComponent(setorId)}`);
}
