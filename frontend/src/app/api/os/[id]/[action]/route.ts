import { NextRequest, NextResponse } from 'next/server';
import { proxyBackend } from '@/lib/api/proxy-backend';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  try {
    const { id, action } = await params;
    if (action !== 'inativar' && action !== 'reativar') {
      return NextResponse.json({ message: 'Ação inválida' }, { status: 400 });
    }

    const body =
      action === 'inativar' ? await request.text() : undefined;

    return proxyBackend(
      request,
      `/os/${encodeURIComponent(id)}/${action}`,
      {
        method: 'PATCH',
        body: body || undefined,
      },
    );
  } catch (error) {
    console.error('Erro na API route inativar/reativar OS:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
