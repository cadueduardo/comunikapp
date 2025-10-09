import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params antes de usar (Next.js 15+)
    const { id } = await params;
    
    // Usando endpoint de teste sem autenticação
    const response = await fetch(`${BACKEND_URL}/test-os-validacoes/${id}/historico`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro do backend:', errorText);
      throw new Error(`Erro ao buscar histórico: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao buscar histórico de validações:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar histórico de validações' },
      { status: 500 }
    );
  }
}
