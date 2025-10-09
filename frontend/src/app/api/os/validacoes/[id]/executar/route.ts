import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params antes de usar (Next.js 15+)
    const { id } = await params;
    
    // Usando endpoint de teste sem autenticação
    const response = await fetch(`${BACKEND_URL}/test-os-validacoes/${id}/executar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro do backend:', errorText);
      throw new Error(`Erro ao executar validações: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao executar validações:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao executar validações' },
      { status: 500 }
    );
  }
}
