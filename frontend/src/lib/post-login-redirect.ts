import {
  buildCanonicalLojaUrl,
  extractTenantSlugFromHost,
  isApexHost,
} from '@/lib/tenant-host';

type LojaRedirect = {
  slug?: string | null;
  url_canonica?: string | null;
};

/**
 * Destino pós-login: no apex (ou slug errado) redireciona para o subdomain canônico.
 */
export function resolvePostLoginHref(loja?: LojaRedirect | null): {
  href: string;
  external: boolean;
} {
  const fallback = { href: '/dashboard', external: false };
  if (typeof window === 'undefined') return fallback;

  const slug = loja?.slug?.trim().toLowerCase();
  if (!slug) return fallback;

  const canon = (
    loja?.url_canonica ||
    buildCanonicalLojaUrl(slug)
  ).replace(/\/$/, '');
  const host = window.location.hostname.toLowerCase();
  const tenantHost = `${slug}.comunikapp.com.br`;

  if (isApexHost(host) || host === 'localhost' || host === '127.0.0.1') {
    // Em localhost mantém same-origin para não quebrar dev.
    if (host === 'localhost' || host === '127.0.0.1') return fallback;
    return { href: `${canon}/dashboard`, external: true };
  }

  const currentSlug = extractTenantSlugFromHost(host);
  if (currentSlug && currentSlug !== slug) {
    return { href: `${canon}/dashboard`, external: true };
  }

  if (host !== tenantHost && currentSlug === null) {
    return { href: `${canon}/dashboard`, external: true };
  }

  return fallback;
}
