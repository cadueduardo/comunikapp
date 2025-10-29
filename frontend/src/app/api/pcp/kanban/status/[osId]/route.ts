import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ osId: string }> }
) {
  try {
    const { osId } = await params;
    
    // Buscar o token de autorização do request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    console.log('🔍 API Route - Atualizando status da OS:', osId);
    
    const response = await fetch(
      buildApiUrl(`/pcp/kanban/status/${osId}`),
      {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    console.log('🔍 API Route - Status da resposta:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('🔍 API Route - Erro do backend:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar status da OS' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 API Route - Resposta do backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/pcp/kanban/status/[osId]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}




