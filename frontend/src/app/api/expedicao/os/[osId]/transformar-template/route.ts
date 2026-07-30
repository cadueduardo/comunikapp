import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string }> },
) {
  const { osId } = await params;
  const body = await request.text();
  return proxyBackend(request, `/expedicao/os/${encodeURIComponent(osId)}/transformar-template`, {
    method: 'POST',
    body: body || undefined,
  });
}
