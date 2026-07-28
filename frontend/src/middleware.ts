import { NextRequest, NextResponse } from 'next/server';
import { extractTenantSlugFromHost, stripPort } from '@/lib/tenant-host';

function backendBaseUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    'http://127.0.0.1:4001'
  ).replace(/\/$/, '');
}

type PublicLojaResolve = {
  id?: string;
  slug?: string;
  redirect_to?: string | null;
};

async function resolveBySlug(slug: string): Promise<{
  status: number;
  data: PublicLojaResolve;
}> {
  const res = await fetch(
    `${backendBaseUrl()}/lojas/public/by-slug/${encodeURIComponent(slug)}`,
    {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );
  const data = (await res.json().catch(() => ({}))) as PublicLojaResolve;
  return { status: res.status, data };
}

async function resolveByHost(host: string): Promise<{
  status: number;
  data: PublicLojaResolve;
}> {
  const res = await fetch(
    `${backendBaseUrl()}/lojas/public/by-host/${encodeURIComponent(host)}`,
    {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );
  const data = (await res.json().catch(() => ({}))) as PublicLojaResolve;
  return { status: res.status, data };
}

function notFoundRedirect(request: NextRequest) {
  // Redirect (não rewrite): evita proxy https://localhost:3001 (EPROTO/500).
  const dest = request.nextUrl.clone();
  dest.pathname = '/loja-nao-encontrada';
  dest.search = '';
  dest.hash = '';
  return NextResponse.redirect(dest);
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/loja-nao-encontrada') {
    return NextResponse.next();
  }

  const hostHeader = request.headers.get('host');
  const host = stripPort(hostHeader ?? '');
  const slug = extractTenantSlugFromHost(hostHeader);

  try {
    if (slug) {
      const { status, data } = await resolveBySlug(slug);

      if (status === 404) {
        return notFoundRedirect(request);
      }

      if (!status || status >= 400) {
        return notFoundRedirect(request);
      }

      if (data.redirect_to && data.redirect_to !== slug) {
        const dest = request.nextUrl.clone();
        dest.host = `${data.redirect_to}.comunikapp.com.br`;
        dest.protocol = 'https:';
        dest.port = '';
        return NextResponse.redirect(dest, 301);
      }

      const requestHeaders = new Headers(request.headers);
      if (data.slug) requestHeaders.set('x-tenant-slug', data.slug);
      if (data.id) requestHeaders.set('x-tenant-loja-id', data.id);

      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      response.headers.set('x-tenant-slug', data.slug || slug);
      return response;
    }

    // Host fora de *.comunikapp.com.br → tentar domínio custom verificado.
    if (
      host &&
      !host.endsWith('.comunikapp.com.br') &&
      host !== 'comunikapp.com.br' &&
      host !== 'localhost' &&
      host !== '127.0.0.1'
    ) {
      const { status, data } = await resolveByHost(host);
      if (status === 404 || !data.slug) {
        return notFoundRedirect(request);
      }
      if (!status || status >= 400) {
        return notFoundRedirect(request);
      }

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-tenant-slug', data.slug);
      if (data.id) requestHeaders.set('x-tenant-loja-id', data.id);
      requestHeaders.set('x-tenant-custom-host', host);

      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      response.headers.set('x-tenant-slug', data.slug);
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[middleware] falha ao resolver tenant', host, error);
    if (
      slug ||
      (host &&
        host !== 'comunikapp.com.br' &&
        host !== 'www.comunikapp.com.br' &&
        !host.endsWith('.comunikapp.com.br'))
    ) {
      return notFoundRedirect(request);
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
