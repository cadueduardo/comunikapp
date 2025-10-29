import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  console.log('🔧 Rota raiz GET chamada');
  try {
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
    const queryParams = new URLSearchParams();
    
    // Copiar todos os query params
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    console.log('🔍 API Route - Buscando setores produtivos');
    
    const url = `${buildApiUrl('/centros-de-trabalho/setores-produtivos')}?${queryParams.toString()}`;
    
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
        { error: error.message || 'Erro ao buscar setores produtivos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 API Route - Resposta do backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/centros-de-trabalho/setores-produtivos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Buscar o token de autorização do request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    console.log('🔍 API Route - Criando setor produtivo');
    
    const response = await fetch(
      buildApiUrl('/centros-de-trabalho/setores-produtivos'),
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
        { error: error.message || 'Erro ao criar setor produtivo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 API Route - Resposta do backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/centros-de-trabalho/setores-produtivos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

