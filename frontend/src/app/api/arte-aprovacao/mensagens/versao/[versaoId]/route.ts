import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versaoId: string }> },
) {
  const { versaoId } = await params;
  return proxyBackend(request, `/arte-aprovacao/mensagens/versao/${encodeURIComponent(versaoId)}`);
}
