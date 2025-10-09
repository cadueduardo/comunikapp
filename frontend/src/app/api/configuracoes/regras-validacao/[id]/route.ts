import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params antes de usar (Next.js 15+)
    const { id } = await params;
    
    const response = await fetch(`${API_URL}/test-validacoes/regras/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      return NextResponse.json({
        success: true,
        data: data.data
      });
    } else {
      throw new Error(data.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('Erro ao buscar regra:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar regra de validação' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params antes de usar (Next.js 15+)
    const { id } = await params;
    const body = await request.json();
    
    const response = await fetch(`${API_URL}/test-validacoes/regras/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (data.success) {
      return NextResponse.json({
        success: true,
        data: data.data
      });
    } else {
      throw new Error(data.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('Erro ao atualizar regra:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar regra de validação' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params antes de usar (Next.js 15+)
    const { id } = await params;
    
    const response = await fetch(`${API_URL}/test-validacoes/regras/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      throw new Error(data.error || 'Erro ao excluir regra');
    }
  } catch (error) {
    console.error('Erro ao excluir regra:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir regra de validação' },
      { status: 500 }
    );
  }
}
