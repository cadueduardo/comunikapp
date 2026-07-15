import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string }> },
) {
  const { osId } = await params;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json(
      { error: 'Token de autorização não fornecido' },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(
      buildApiUrl(`/pcp/workflows/sugestoes-itens/${osId}`),
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    );
    const data = await response.json().catch(() => []);

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || 'Erro ao buscar sugestões por produto' },
        { status: response.status },
      );
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(
      'Erro na API route /api/pcp/workflows/sugestoes-itens/[osId]:',
      error,
    );
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
