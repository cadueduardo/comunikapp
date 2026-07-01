import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  const queryString = request.nextUrl.searchParams.toString();
  const path = queryString
    ? `/instalacao/agenda/conflitos?${queryString}`
    : '/instalacao/agenda/conflitos';
  return proxyBackend(request, path);
}
