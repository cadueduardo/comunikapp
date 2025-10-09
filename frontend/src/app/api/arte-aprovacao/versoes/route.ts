import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🎨 [API Route] Criando versão:', body);

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/versoes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ [API Route] Erro do backend:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Erro ao criar versão', error: errorData.error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [API Route] Versão criada:', data.id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [API Route] Erro ao criar versão:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor', error: error.name || 'InternalServerError' },
      { status: error.status || 500 }
    );
  }
}
