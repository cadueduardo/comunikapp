import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const lojaId = request.headers.get('x-loja-id');

    if (!token || !lojaId) {
      return NextResponse.json(
        { error: 'Token de autorização e ID da loja são obrigatórios' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/estoque/lotes/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'x-loja-id': lojaId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erro ao buscar lote' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota GET /api/estoque/lotes/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const lojaId = request.headers.get('x-loja-id');
    const body = await request.json();

    if (!token || !lojaId) {
      return NextResponse.json(
        { error: 'Token de autorização e ID da loja são obrigatórios' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/estoque/lotes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'x-loja-id': lojaId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erro ao atualizar lote' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na rota PUT /api/estoque/lotes/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const lojaId = request.headers.get('x-loja-id');

    if (!token || !lojaId) {
      return NextResponse.json(
        { error: 'Token de autorização e ID da loja são obrigatórios' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/estoque/lotes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
        'x-loja-id': lojaId,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Erro ao excluir lote' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota DELETE /api/estoque/lotes/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

