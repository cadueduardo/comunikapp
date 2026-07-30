import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string }> },
) {
  const { osId } = await params;
  return proxyBackend(request, `/pcp/workflows/sugestao/${encodeURIComponent(osId)}`);
}
