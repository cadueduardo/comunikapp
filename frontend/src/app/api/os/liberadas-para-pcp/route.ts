import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');

    // Validar token
    if (!token || token === 'Bearer null' || token === 'Bearer undefined') {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    console.log('🔍 API Route - Token recebido:', !!token);

    const response = await fetch(`${BACKEND_URL}/os/liberadas-para-pcp`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/os/liberadas-para-pcp:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
