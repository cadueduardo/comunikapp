import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar params antes de usar (Next.js 15+)
    const { id } = await params;
    
    const token = await getAuthToken();

    // Validar token antes de fazer requisição
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não encontrado' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/os/calculo-material/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na resposta do backend:', errorData);
      throw new Error(errorData.message || 'Erro ao calcular materiais');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao calcular materiais:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao calcular materiais' },
      { status: 500 }
    );
  }
}

