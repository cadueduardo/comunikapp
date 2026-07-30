import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const body = await request.text();
  return proxyBackend(
    request,
    `/os/${encodeURIComponent(id)}/itens/${encodeURIComponent(itemId)}/registrar-sobra`,
    { method: 'POST', body },
  );
}
