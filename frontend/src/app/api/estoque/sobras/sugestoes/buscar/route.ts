import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();
  return proxyBackend(
    request,
    qs
      ? `/api/estoque/sobras/sugestoes/buscar?${qs}`
      : '/api/estoque/sobras/sugestoes/buscar',
  );
}
