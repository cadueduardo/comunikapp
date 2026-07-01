import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

type RouteContext = { params: Promise<{ osId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 },
      );
    }

    const { osId } = await context.params;
    const response = await fetch(
      buildApiUrl(`/instalacao/os/${osId}/relatorio-tecnico`),
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status === 404) {
      return NextResponse.json(null, { status: 404 });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro GET relatorio-tecnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { osId } = await context.params;
  const { proxyBackend } = await import('@/lib/api/proxy-backend');
  return proxyBackend(request, `/instalacao/os/${osId}/relatorio-tecnico`, {
    method: 'POST',
  });
}
