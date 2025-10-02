import { NextRequest, NextResponse } from 'next/server';

// GET /api/os/[id]/imprimir - Gerar template de impressão da OS
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const { searchParams } = new URL(request.url);
    
    // Parâmetros da query string
    const versao = searchParams.get('versao') || 'simples';
    const formato = searchParams.get('formato') || 'html';
    const incluirQRCode = searchParams.get('incluirQRCode') || 'true';
    const incluirLogo = searchParams.get('incluirLogo') || 'true';
    const incluirDetalhesTecnicos = searchParams.get('incluirDetalhesTecnicos') || 'true';

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    // Construir URL da API do backend
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const backendUrl = `${baseUrl}/os/${id}/imprimir?` + new URLSearchParams({
      versao,
      formato,
      incluirQRCode,
      incluirLogo,
      incluirDetalhesTecnicos
    });

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Erro ao gerar template de impressão' },
        { status: response.status }
      );
    }

    // Retornar HTML diretamente
    const html = await response.text();
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Erro na API de impressão da OS:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
