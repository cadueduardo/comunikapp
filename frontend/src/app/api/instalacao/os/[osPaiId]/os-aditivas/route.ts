import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

type RouteContext = { params: Promise<{ osPaiId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { osPaiId } = await context.params;
  return proxyBackend(request, `/instalacao/os/${osPaiId}/os-aditivas`, {
    method: 'GET',
  });
}
