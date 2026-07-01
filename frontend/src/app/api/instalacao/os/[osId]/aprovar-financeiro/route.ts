import { NextRequest } from 'next/server';
import { proxyBackend } from '../../_proxy';

type RouteContext = { params: Promise<{ osId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { osId } = await context.params;
  return proxyBackend(request, `/instalacao/os/${osId}/aprovar-financeiro`, {
    method: 'POST',
    body: '{}',
  });
}
