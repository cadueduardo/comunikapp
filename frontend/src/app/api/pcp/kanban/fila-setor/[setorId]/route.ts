import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setorId: string }> }
) {
  try {
    const { setorId } = await params;
    
    // Buscar o token de autorização do request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }
    
    // Pegar query params
    const { searchParams } = new URL(request.url);
    const operadorId = searchParams.get('operadorId');
    
    console.log('🔍 API Route - Buscando fila do setor:', setorId);
    
    const queryParams = new URLSearchParams();
    if (operadorId) {
      queryParams.append('operadorId', operadorId);
    }
    
    const url = `${buildApiUrl(`/pcp/kanban/fila-setor/${setorId}`)}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 API Route - Status da resposta:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('🔍 API Route - Erro do backend:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao buscar fila do setor' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 API Route - Resposta do backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/pcp/kanban/fila-setor/[setorId]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}








