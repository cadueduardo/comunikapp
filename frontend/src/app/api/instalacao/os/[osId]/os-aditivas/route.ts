import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

type RouteContext = { params: Promise<{ osId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { osId } = await context.params;
  return proxyBackend(request, `/instalacao/os/${osId}/os-aditivas`, {
    method: 'GET',
  });
}
