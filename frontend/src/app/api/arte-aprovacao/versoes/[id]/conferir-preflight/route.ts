import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyBackend(request, `/arte-aprovacao/versoes/${encodeURIComponent(id)}/conferir-preflight`, {
    method: 'POST',
    body: body || undefined,
  });
}
