import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

type RouteContext = { params: Promise<{ osPaiId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { osPaiId } = await context.params;
  const body = await request.text();
  return proxyBackend(request, `/instalacao/os/${osPaiId}/gerar-os-aditiva`, {
    method: 'POST',
    body: body || '{}',
  });
}
