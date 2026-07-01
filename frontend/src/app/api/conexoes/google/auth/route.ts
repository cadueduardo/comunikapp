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

export async function GET(request: NextRequest) {
  try {
    const authHeader = obterAuthHeader(request);
    if (typeof authHeader !== 'string') return authHeader;

    const response = await fetch(buildApiUrl('/conexoes/google/auth'), {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Erro na API route conexoes google auth GET:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
