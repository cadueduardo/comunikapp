import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyBackend(
    request,
    `/api/estoque/localizacoes/${encodeURIComponent(id)}`,
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();
  return proxyBackend(
    request,
    `/api/estoque/localizacoes/${encodeURIComponent(id)}`,
    { method: 'PUT', body },
  );
}
