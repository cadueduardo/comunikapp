import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  return proxyBackend(
    request,
    `/os/${encodeURIComponent(id)}/itens/${encodeURIComponent(itemId)}/ignorar-sobra`,
    { method: 'POST', body: '{}' },
  );
}
