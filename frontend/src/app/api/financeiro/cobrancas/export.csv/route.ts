import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { resolveBackendAuth } from '@/lib/api/proxy-backend';

export async function GET(request: NextRequest) {
  try {
    const auth = resolveBackendAuth(request);
    if (!auth.ok) return auth.response;

    const qs = request.nextUrl.searchParams.toString();
    const url = qs
      ? `${buildApiUrl('/financeiro/cobrancas/export.csv')}?${qs}`
      : buildApiUrl('/financeiro/cobrancas/export.csv');

    const response = await fetch(url, {
      method: 'GET',
      headers: auth.headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: error.message || 'Erro ao exportar CSV' },
        { status: response.status },
      );
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      headers.set('Content-Disposition', contentDisposition);
    }

    return new NextResponse(blob, { status: 200, headers });
  } catch (error) {
    console.error(
      'Erro na API route /api/financeiro/cobrancas/export.csv:',
      error,
    );
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
