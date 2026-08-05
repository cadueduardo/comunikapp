import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return proxyBackend(request, `/vendas/atividades/${id}/concluir`, { method: 'POST' });
}