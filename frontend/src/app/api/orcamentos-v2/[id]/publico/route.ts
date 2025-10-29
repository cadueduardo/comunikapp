import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 [API ROUTE] Buscando orçamento público com ID: ${id}`);
    
    const apiUrl = buildApiUrl(`/orcamentos-v2/${id}/publico`);
    console.log(`🔍 [API ROUTE] URL do backend: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
    });

    console.log(`🔍 [API ROUTE] Resposta do backend: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ [API ROUTE] Erro do backend:`, error);
      return NextResponse.json(
        { error: error.message || 'Erro ao buscar orçamento público' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ [API ROUTE] Orçamento encontrado com sucesso`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Erro na API route /api/orcamentos-v2/[id]/publico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

