import { NextRequest } from 'next/server';
import { proxyBackend } from '../../_proxy';

type RouteContext = { params: Promise<{ cep: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { cep } = await context.params;
  return proxyBackend(request, `/instalacao/cep/${cep}`);
}
