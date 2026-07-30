import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string; itemId: string }> },
) {
  const { osId, itemId } = await params;
  const body = await request.text();
  return proxyBackend(
    request,
    `/os/produtos/${encodeURIComponent(osId)}/item/${encodeURIComponent(itemId)}/liberar-pcp`,
    { method: 'POST', body },
  );
}
