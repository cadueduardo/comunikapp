import { NextRequest, NextResponse } from 'next/server';

// Em route handlers do Next.js (server-side) precisamos da URL absoluta do
// backend. `buildApiUrl('')` resolvia para "/api" (relativo) e quebrava o
// fetch com ERR_INVALID_URL. Aqui seguimos o padrao usado pelas demais
// rotas: ler `process.env.BACKEND_URL` e cair em http://localhost:4000.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// GET /api/os - Listar todas as OS
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token nao fornecido' }, { status: 401 });
    }

    // Extrair query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const status = searchParams.get('status');
    const responsavel = searchParams.get('responsavel');

    // Construir URL com parametros
    let url = `${BACKEND_URL}/os?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (responsavel) url += `&responsavel=${responsavel}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `Erro ${response.status}: ${response.statusText}` };
      }
      return NextResponse.json(
        { error: errorData.message || 'Erro ao buscar OS' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API de OS:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/os - Criar nova OS
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token nao fornecido' }, { status: 401 });
    }

    const body = await request.json();
    const url = `${BACKEND_URL}/os`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `Erro ${response.status}: ${response.statusText}` };
      }
      return NextResponse.json(
        { error: errorData.message || 'Erro ao criar OS' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API de OS:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
