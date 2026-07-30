import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string; produtoId: string }> },
) {
  const { osId, produtoId } = await params;
  return proxyBackend(request, `/arte-aprovacao/mensagens/os/${encodeURIComponent(osId)}/produto/${encodeURIComponent(produtoId)}`);
}
