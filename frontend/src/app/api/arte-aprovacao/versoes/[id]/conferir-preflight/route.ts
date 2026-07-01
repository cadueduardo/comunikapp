import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const response = await fetch(
      `${API_BASE_URL}/arte-aprovacao/versoes/${id}/conferir-preflight`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Erro ao conferir arte',
          error: errorData.error,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; name?: string };
    console.error('❌ [API Route] Erro ao conferir preflight:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Erro interno do servidor',
        error: err.name || 'InternalServerError',
      },
      { status: err.status || 500 },
    );
  }
}
