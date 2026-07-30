import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

/**
 * Query (`os_desde`, `refresh`, etc.) é encaminhada por `proxyBackend` —
 * não embutir qs no path (duplicava params e zerava os badges no Nest).
 */
export async function GET(request: NextRequest) {
  return proxyBackend(request, '/home-operacional/contadores-menu');
}
