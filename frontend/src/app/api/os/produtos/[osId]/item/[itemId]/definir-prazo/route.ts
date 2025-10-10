import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string; itemId: string }> }
) {
  try {
    const { osId, itemId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    console.log('Params da rota - osId:', osId, 'itemId:', itemId);

    if (!osId || !itemId) {
      console.log('Erro: osId ou itemId não fornecidos');
      return NextResponse.json({ error: 'osId e itemId são obrigatórios' }, { status: 400 });
    }

    const body = await request.json();
    console.log('Body recebido:', JSON.stringify(body, null, 2));

    const response = await fetch(`${API_BASE_URL}/os/produtos/${osId}/item/${itemId}/definir-prazo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Erro do backend:', errorData);
      console.log('Status:', response.status);
      return NextResponse.json(
        { error: errorData.message || 'Erro ao definir prazo do produto' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao definir prazo do produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
