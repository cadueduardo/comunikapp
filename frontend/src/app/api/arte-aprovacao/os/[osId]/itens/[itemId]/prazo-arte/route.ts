import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string; itemId: string }> },
) {
  const { osId, itemId } = await params;
  const body = await request.text();
  return proxyBackend(
    request,
    `/arte-aprovacao/os/${encodeURIComponent(osId)}/itens/${encodeURIComponent(itemId)}/prazo-arte`,
    { method: 'PATCH', body },
  );
}
