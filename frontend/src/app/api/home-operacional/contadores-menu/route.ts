import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  return proxyBackend(
    request,
    qs
      ? `/home-operacional/contadores-menu?${qs}`
      : '/home-operacional/contadores-menu',
  );
}
