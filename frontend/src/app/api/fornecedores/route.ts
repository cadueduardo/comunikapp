import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  // Query string é encaminhada por proxyBackend — não embutir no path.
  return proxyBackend(request, '/fornecedores', {
    method: 'GET',
    cache: 'no-store',
  });
}

export async function POST(request: NextRequest) {
  return proxyBackend(request, '/fornecedores', {
    method: 'POST',
    body: await request.text(),
  });
}
