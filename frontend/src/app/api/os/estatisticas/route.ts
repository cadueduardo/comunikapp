import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      (await getAuthToken());

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticação não encontrado' },
        { status: 401 },
      );
    }

    const response = await fetch(`${BACKEND_URL}/os/estatisticas`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message:
            errorData.message || 'Erro ao buscar estatísticas das OS',
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/os/estatisticas:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
