import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemOsId: string }> },
) {
  try {
    const { itemOsId } = await params;
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 },
      );
    }

    const body = await request.json();

    const response = await fetch(
      buildApiUrl(`/pcp/kanban/mover-setor/${itemOsId}`),
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(
      'Erro na API route /api/pcp/kanban/mover-setor/[itemOsId]:',
      error,
    );
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
