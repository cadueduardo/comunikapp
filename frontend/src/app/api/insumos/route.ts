import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const resp = await fetch(`${process.env.BACKEND_URL || 'http://localhost:4000'}/insumos`, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return NextResponse.json({ message: err.message || 'Erro ao carregar insumos' }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Erro interno ao proxy de insumos' }, { status: 500 });
  }
}



