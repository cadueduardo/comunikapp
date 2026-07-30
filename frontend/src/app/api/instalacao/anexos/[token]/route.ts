import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { resolveBackendAuth } from '@/lib/api/proxy-backend';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = resolveBackendAuth(request);
    if (!auth.ok) return auth.response;

    const { token } = await context.params;
    const response = await fetch(
      buildApiUrl(`/instalacao/anexos/${encodeURIComponent(token)}`),
      { headers: auth.headers },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('Erro ao baixar anexo de instalação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
