import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

type RouteContext = { params: Promise<{ cep: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { cep } = await context.params;
  return proxyBackend(request, `/instalacao/cep/${cep}`);
}
