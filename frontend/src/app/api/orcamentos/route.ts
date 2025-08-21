import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 Debug - Frontend API - Dados recebidos:', JSON.stringify(body, null, 2));
    
    const response = await fetch(buildApiUrl('/orcamentos'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '') || ''}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('🔍 Debug - Frontend API - Erro do backend:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao criar orçamento' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 Debug - Frontend API - Resposta do backend:', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔍 Debug - Frontend API - Erro na API route /api/orcamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(buildApiUrl('/orcamentos'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '') || ''}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Erro ao buscar orçamentos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/orcamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 