import { NextRequest, NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config';
import { SESSION_COOKIE_NAME } from '@/lib/auth-cookie';

function extrairJwtDoCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const parte of cookieHeader.split(';')) {
    const [nome, ...rest] = parte.trim().split('=');
    if (nome === SESSION_COOKIE_NAME) {
      const valor = rest.join('=').trim();
      if (!valor || valor === 'null' || valor === 'undefined') return null;
      try {
        return decodeURIComponent(valor);
      } catch {
        return valor;
      }
    }
  }
  return null;
}

// GET /api/os/[id]/imprimir — HTML da OS (auth cookie ou Bearer)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    const jwtDoCookie = extrairJwtDoCookie(cookieHeader);

    const hasBearer =
      !!authHeader &&
      authHeader.toLowerCase().startsWith('bearer ') &&
      authHeader.slice(7).trim() !== '' &&
      authHeader.slice(7).trim() !== 'cookie-session';

    if (!hasBearer && !jwtDoCookie) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams({
      versao: searchParams.get('versao') || 'simples',
      formato: searchParams.get('formato') || 'html',
      incluirQRCode: searchParams.get('incluirQRCode') || 'true',
      incluirLogo: searchParams.get('incluirLogo') || 'true',
      incluirDetalhesTecnicos:
        searchParams.get('incluirDetalhesTecnicos') || 'true',
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (hasBearer && authHeader) {
      headers.Authorization = authHeader;
    } else if (jwtDoCookie) {
      headers.Authorization = `Bearer ${jwtDoCookie}`;
    }
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const response = await fetch(
      buildApiUrl(`/os/${encodeURIComponent(id)}/imprimir?${qs.toString()}`),
      { method: 'GET', headers },
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
