import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    // Usar endpoint de teste sem autenticação
    const response = await fetch(`${API_URL}/test-validacoes/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      return NextResponse.json(data);
    } else {
      throw new Error(data.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dashboard de validações' },
      { status: 500 }
    );
  }
}

