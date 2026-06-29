import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

function obterAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json(
      { error: 'Token de autorização não fornecido' },
      { status: 401 },
    );
  }
  return authHeader;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ itemOsId: string }> },
) {
  try {
    const authHeader = obterAuthHeader(request);
    if (typeof authHeader !== 'string') return authHeader;

    const { itemOsId } = await context.params;
    const response = await fetch(
      buildApiUrl(`/arte-aprovacao/fila/${itemOsId}/assumir`),
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Erro na API route arte assumir:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
