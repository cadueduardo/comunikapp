import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET() {
  try {
    // Usando endpoint de teste sem autenticação
    // TODO: Mudar para endpoint autenticado quando em produção
    const response = await fetch(`${BACKEND_URL}/test-campos-validacao`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar campos de validação');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar campos de validação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar campos de validação' },
      { status: 500 }
    );
  }
}

