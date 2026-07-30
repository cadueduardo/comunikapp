import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  return proxyBackend(request, `/insumos`);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, `/insumos`, {
    method: 'POST',
    body: body || undefined,
  });
}
