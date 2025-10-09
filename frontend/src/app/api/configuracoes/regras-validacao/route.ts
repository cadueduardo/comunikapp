import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    // Usar endpoint de teste sem autenticação
    const url = `${API_URL}/test-validacoes/regras${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (data.success) {
      return NextResponse.json({
        data: data.data,
        total: data.total,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    } else {
      throw new Error(data.error || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('Erro ao buscar regras:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar regras de validação' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${API_URL}/configuracoes/regras-validacao`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao criar regra:', error);
    return NextResponse.json(
      { error: 'Erro ao criar regra de validação' },
      { status: 500 }
    );
  }
}

