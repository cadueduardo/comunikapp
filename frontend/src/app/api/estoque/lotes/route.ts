import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();
  return proxyBackend(
    request,
    qs ? `/api/estoque/lotes?${qs}` : '/api/estoque/lotes',
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, '/api/estoque/lotes', {
    method: 'POST',
    body,
  });
}
