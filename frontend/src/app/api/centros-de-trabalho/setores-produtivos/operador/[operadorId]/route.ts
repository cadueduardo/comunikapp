import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ operadorId: string }> },
) {
  const { operadorId } = await params;
  return proxyBackend(request, `/centros-de-trabalho/setores-produtivos/operador/${encodeURIComponent(operadorId)}`);
}
