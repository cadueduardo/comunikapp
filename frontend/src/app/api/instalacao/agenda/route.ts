import { NextRequest } from 'next/server';
import { proxyBackend } from '../_proxy';

export async function GET(request: NextRequest) {
  const queryString = request.nextUrl.searchParams.toString();
  const path = queryString
    ? `/instalacao/agenda?${queryString}`
    : '/instalacao/agenda';
  return proxyBackend(request, path);
}
