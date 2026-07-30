import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { resolveBackendAuth } from '@/lib/api/proxy-backend';

// GET /api/os/[id]/imprimir — HTML da OS (auth cookie ou Bearer)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = resolveBackendAuth(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams({
      versao: searchParams.get('versao') || 'simples',
      formato: searchParams.get('formato') || 'html',
      incluirQRCode: searchParams.get('incluirQRCode') || 'true',
      incluirLogo: searchParams.get('incluirLogo') || 'true',
      incluirDetalhesTecnicos:
        searchParams.get('incluirDetalhesTecnicos') || 'true',
    });

    const response = await fetch(
      buildApiUrl(
        `/os/${encodeURIComponent(id)}/imprimir?${qs.toString()}`,
      ),
      {
        method: 'GET',
        headers: {
          ...auth.headers,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error:
            errorData.message ||
            errorData.error ||
            'Erro ao gerar template de impressão',
        },
        { status: response.status },
      );
    }

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
      { status: 500 },
    );
  }
}
