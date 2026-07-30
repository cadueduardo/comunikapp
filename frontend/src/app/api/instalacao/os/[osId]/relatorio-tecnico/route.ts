import { NextRequest, NextResponse } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

type RouteContext = { params: Promise<{ osId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { osId } = await context.params;
  const response = await proxyBackend(
    request,
    `/instalacao/os/${encodeURIComponent(osId)}/relatorio-tecnico`,
  );

  // Cliente trata 404 como "ainda sem relatório" (null).
  if (response.status === 404) {
    return NextResponse.json(null, { status: 404 });
  }
  return response;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { osId } = await context.params;
  return proxyBackend(
    request,
    `/instalacao/os/${encodeURIComponent(osId)}/relatorio-tecnico`,
    { method: 'POST' },
  );
}
