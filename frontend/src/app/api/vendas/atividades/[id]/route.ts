import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyBackend(request, `/vendas/atividades/${id}`, { method: 'GET' });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyBackend(request, `/vendas/atividades/${id}`, { method: 'PATCH' });
}