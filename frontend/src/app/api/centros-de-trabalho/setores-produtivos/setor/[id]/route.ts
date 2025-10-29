import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🎯 === ROTA [id] CHAMADA! ===');
  try {
    const { id } = await params;
    console.log('🎯 === ROTA [id] RECONHECIDA - ID:', id, '===');
    
    // Buscar o token de autorização do request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }
    
    console.log('🔍 Buscando setor:', id);
    
    const response = await fetch(
      buildApiUrl(`/centros-de-trabalho/setores-produtivos/${id}`),
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('🔍 Status da resposta:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('🔍 Erro do backend:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao buscar setor produtivo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 Dados do setor:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ ERRO na rota [id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    const response = await fetch(
      buildApiUrl(`/centros-de-trabalho/setores-produtivos/${id}`),
      {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar setor produtivo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao atualizar setor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }
    
    const response = await fetch(
      buildApiUrl(`/centros-de-trabalho/setores-produtivos/${id}`),
      {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Erro ao deletar setor produtivo' },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: 'Setor deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar setor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
