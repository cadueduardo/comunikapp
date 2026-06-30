import { NextRequest } from 'next/server';
import { proxyBackend } from '../../../instalacao/_proxy';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.text();
  return proxyBackend(request, `/instalador/lotes/${id}/concluir`, {
    method: 'PATCH',
    body,
  });
}
