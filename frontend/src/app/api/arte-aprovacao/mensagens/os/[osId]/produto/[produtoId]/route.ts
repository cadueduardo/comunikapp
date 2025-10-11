import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string; produtoId: string }> }
) {
  try {
    const { osId, produtoId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    console.log('🔍 [API Route] Listando mensagens do produto:', { osId, produtoId });

    const response = await fetch(`${API_BASE_URL}/arte-aprovacao/mensagens/os/${osId}/produto/${produtoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ [API Route] Erro do backend:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Erro ao listar mensagens', error: errorData.error },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ [API Route] ${data.length} mensagens encontradas`);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [API Route] Erro ao listar mensagens:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro interno do servidor', error: error.name || 'InternalServerError' },
      { status: error.status || 500 }
    );
  }
}
