import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  return proxyBackend(request, `/produtos`);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, `/produtos`, {
    method: 'POST',
    body: body || undefined,
  });
}
