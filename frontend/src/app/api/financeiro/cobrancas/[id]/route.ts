import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Token de autorização não fornecido' },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const response = await fetch(buildApiUrl(`/financeiro/cobrancas/${id}`), {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Erro ao carregar cobrança' },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Erro na API route /api/financeiro/cobrancas/[id]:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
