import { NextRequest, NextResponse } from 'next/server';
import { extractTenantSlugFromHost } from '@/lib/tenant-host';

function backendBaseUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'http://127.0.0.1:4001'
  ).replace(/\/$/, '');
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/loja-nao-encontrada') {
    return NextResponse.next();
  }

  const host = request.headers.get('host');
  const slug = extractTenantSlugFromHost(host);

  if (!slug) {
    return NextResponse.next();
  }

  // Não bloqueia assets/BFF; só injeta contexto e valida existência da loja.
  try {
    const res = await fetch(
      `${backendBaseUrl()}/lojas/public/by-slug/${encodeURIComponent(slug)}`,
      {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      const url = request.nextUrl.clone();
      url.pathname = '/loja-nao-encontrada';
      url.search = '';
      const rewrite = NextResponse.rewrite(url);
      rewrite.headers.set('x-tenant-slug-invalid', slug);
      return rewrite;
    }

    const loja = (await res.json()) as { id?: string; slug?: string };
    const requestHeaders = new Headers(request.headers);
    if (loja.slug) requestHeaders.set('x-tenant-slug', loja.slug);
    if (loja.id) requestHeaders.set('x-tenant-loja-id', loja.id);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('x-tenant-slug', loja.slug || slug);
    return response;
  } catch (error) {
    console.error('[middleware] falha ao resolver tenant', slug, error);
    // Em falha de rede do backend, não derruba o site inteiro no apex-like path;
    // no tenant, reescreve para página amigável.
    const url = request.nextUrl.clone();
    url.pathname = '/loja-nao-encontrada';
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: [
    /*
     * Exclui estáticos e favicon; inclui páginas e /api/auth (BFF no mesmo host).
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
