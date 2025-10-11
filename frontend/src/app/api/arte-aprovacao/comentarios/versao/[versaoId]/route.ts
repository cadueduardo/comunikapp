import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { versaoId: string } }
) {
  try {
    const { versaoId } = params;
    
    const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/comentarios/versao/${versaoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '')}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Erro ao listar comentários:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}

