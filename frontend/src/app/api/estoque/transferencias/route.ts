import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  return proxyBackend(request, '/api/estoque/transferencias');
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, '/api/estoque/transferencias', {
    method: 'POST',
    body,
  });
}
