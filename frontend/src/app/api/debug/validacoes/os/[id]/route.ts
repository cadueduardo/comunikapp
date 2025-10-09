import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params antes de usar (Next.js 15+)
    const { id } = await params;
    
    const response = await fetch(`${BACKEND_URL}/debug/validacoes/os/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao executar debug');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao executar debug:', error);
    return NextResponse.json(
      { error: 'Erro ao executar debug' },
      { status: 500 }
    );
  }
}

