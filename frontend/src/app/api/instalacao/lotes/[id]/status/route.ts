import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../_proxy';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.text();
  return proxyBackend(request, `/instalacao/lotes/${id}/status`, {
    method: 'PATCH',
    body,
  });
}
