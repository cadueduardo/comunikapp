import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  console.log('🔍 [POST /api/arte-aprovacao/mensagens/publico/[token]] Requisição recebida');
  try {
    const { token } = await params;
    console.log('🔍 Token extraído:', token);
    const body = await request.json();
    console.log('🔍 Body:', body);
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    const response = await fetch(`${backendUrl}/arte-aprovacao/mensagens/publico/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    console.log('🔍 [Frontend API] Resposta do backend:', data);
    
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Erro ao enviar mensagem' },
        { status: response.status }
      );
    }
    
    // Retornar a resposta do backend diretamente (não criar wrapper)
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API de mensagens públicas:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

