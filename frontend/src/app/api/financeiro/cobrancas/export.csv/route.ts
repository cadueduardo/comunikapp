import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Token de autorização não fornecido' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    const url = `${buildApiUrl('/financeiro/cobrancas/export.csv')}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
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
    console.error('Erro na API route /api/financeiro/cobrancas/export.csv:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
