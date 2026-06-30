import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../instalacao/_proxy';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyBackend(request, `/instalador/lotes/${id}`);
}
