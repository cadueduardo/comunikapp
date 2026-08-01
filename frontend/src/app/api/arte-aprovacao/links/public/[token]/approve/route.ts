import { NextRequest, NextResponse } from 'next/server';
import { cabecalhosDeEncaminhamento } from '@/lib/client-ip';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    // Gate 0S / HS-03: o repasse do IP passa pelo helper compartilhado, que lê
    // `X-Real-IP` ou o **último** elemento de `X-Forwarded-For` e valida o
    // formato. A versão anterior repassava o cabeçalho cru do cliente, então
    // bastava enviar `X-Forwarded-For: 1.2.3.4` para escolher a própria origem
    // no rate limit e na auditoria do backend.
    const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/links/public/${token}/approve`, {
      method: 'POST',
      headers: {
        ...cabecalhosDeEncaminhamento(request.headers),
        'User-Agent': request.headers.get('user-agent') || 'unknown',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API Route] Erro ao processar aprovação:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}
