import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyBackend(request, '/instalacao/configuracao/os-aditiva', {
    method: 'PATCH',
    body,
  });
}
