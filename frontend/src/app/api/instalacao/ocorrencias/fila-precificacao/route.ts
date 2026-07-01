import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  const path = `/instalacao/ocorrencias/fila-precificacao${query ? `?${query}` : ''}`;
  return proxyBackend(request, path, { method: 'GET' });
}
