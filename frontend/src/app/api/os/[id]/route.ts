import { NextRequest, NextResponse } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'ID da OS é obrigatório' },
      { status: 400 },
    );
  }

  return proxyBackend(request, `/os/${encodeURIComponent(id)}`);
}
