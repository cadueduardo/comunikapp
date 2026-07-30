import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyBackend(request, `/financeiro/cobrancas/${encodeURIComponent(id)}`);
}
