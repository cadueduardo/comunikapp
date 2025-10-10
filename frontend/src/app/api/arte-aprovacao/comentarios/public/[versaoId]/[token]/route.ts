import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { versaoId: string; token: string } }
) {
  try {
    const { versaoId, token } = params;
    
    const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/comentarios/public/${versaoId}/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Erro ao listar comentários públicos:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}
