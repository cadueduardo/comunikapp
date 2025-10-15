import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * GET /api/arte-aprovacao/versoes/[id]
 * Buscar uma versão específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/versoes/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Erro ao buscar versão' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar versão:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno ao buscar versão' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/arte-aprovacao/versoes/[id]
 * Atualizar uma versão (status, descrição, observações)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/versoes/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Erro ao atualizar versão' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar versão:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno ao atualizar versão' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/arte-aprovacao/versoes/[id]
 * Remover uma versão
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/versoes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { success: false, message: data.message || 'Erro ao remover versão' },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Versão removida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover versão:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno ao remover versão' },
      { status: 500 }
    );
  }
}

