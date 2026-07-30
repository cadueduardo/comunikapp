import { NextRequest, NextResponse } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string; itemId: string }> },
) {
  const { osId, itemId } = await params;
  if (!osId || !itemId) {
    return NextResponse.json(
      { error: 'osId e itemId são obrigatórios' },
      { status: 400 },
    );
  }
  const body = await request.text();
  return proxyBackend(
    request,
    `/os/produtos/${encodeURIComponent(osId)}/item/${encodeURIComponent(itemId)}/definir-prazo`,
    { method: 'POST', body },
  );
}
