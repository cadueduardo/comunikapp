import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

type RouteContext = { params: Promise<{ osId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { osId } = await context.params;
  const body = await request.text();
  return proxyBackend(request, `/instalacao/os/${osId}/gerar-os-aditiva`, {
    method: 'POST',
    body: body || '{}',
  });
}
