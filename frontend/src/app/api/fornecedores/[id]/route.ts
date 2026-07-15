import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyBackend(request, `/fornecedores/${encodeURIComponent(id)}`, {
    method: 'GET',
    cache: 'no-store',
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyBackend(request, `/fornecedores/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: await request.text(),
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyBackend(request, `/fornecedores/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
