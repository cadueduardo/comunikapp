import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  return proxyBackend(request, `/arte-aprovacao/configuracao`);
}

export async function PUT(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, `/arte-aprovacao/configuracao`, {
    method: 'PUT',
    body: body || undefined,
  });
}
