import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemOsId: string }> }
) {
  try {
    const { itemOsId } = await params;
    
    // Buscar o token de autorização do request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    console.log('🔍 API Route - Pausando produção do item:', itemOsId);
    
    const response = await fetch(
      buildApiUrl(`/pcp/kanban/pausar/${itemOsId}`),
      {
        method: 'POST',
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
        { error: error.message || 'Erro ao pausar produção' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 API Route - Resposta do backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/pcp/kanban/pausar/[itemOsId]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}




