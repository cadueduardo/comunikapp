import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemOsId: string }> },
) {
  const { itemOsId } = await params;
  const body = await request.text();
  return proxyBackend(request, `/arte-aprovacao/fila/${encodeURIComponent(itemOsId)}/liberar-pcp`, {
    method: 'POST',
    body: body || undefined,
  });
}
