import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/lojas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        return NextResponse.json(error, { status: response.status });
      } catch {
        return NextResponse.json(
          { message: 'Não foi possível criar a conta. Tente novamente.' },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return NextResponse.json(
      { message: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.' },
      { status: 500 }
    );
  }
}

