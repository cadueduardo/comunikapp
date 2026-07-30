import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  return proxyBackend(request, `/pcp/configuracao`);
}

export async function PUT(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, `/pcp/configuracao`, {
    method: 'PUT',
    body: body || undefined,
  });
}
