import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 API Route - Reenviando código para orçamento:', id);
    
    const response = await fetch(buildApiUrl(`/orcamentos-v2/${id}/reenviar-codigo`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔍 API Route - Status da resposta:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log('🔍 API Route - Erro do backend:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao reenviar código' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔍 API Route - Resposta do backend:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API route /api/orcamentos-v2/reenviar-codigo/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}




