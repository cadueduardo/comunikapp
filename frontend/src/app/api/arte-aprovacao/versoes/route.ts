import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, `/arte-aprovacao/versoes`, {
    method: 'POST',
    body: body || undefined,
  });
}
