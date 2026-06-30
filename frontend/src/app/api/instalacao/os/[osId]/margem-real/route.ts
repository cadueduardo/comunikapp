import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../_proxy';

type RouteContext = { params: Promise<{ osId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { osId } = await context.params;
  return proxyBackend(request, `/instalacao/os/${osId}/margem-real`);
}
