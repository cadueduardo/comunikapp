import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token =
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
      (await getAuthToken());

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não encontrado' },
        { status: 401 },
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID da OS é obrigatório' },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/os/validacoes/${id}/historico`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Erro ao buscar histórico de validações',
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar histórico de validações:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar histórico de validações',
      },
      { status: 500 },
    );
  }
}
