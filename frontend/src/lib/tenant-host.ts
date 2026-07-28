/**
 * Parse de host tenant: {slug}.comunikapp.com.br
 * Apex/www e hosts reservados não são tenant.
 */

export const APEX_HOSTS = new Set([
  'comunikapp.com.br',
  'www.comunikapp.com.br',
]);

export const TENANT_HOST_SUFFIX = '.comunikapp.com.br';

/** Subdomínios de infra — nunca tratados como slug de loja. */
export const TENANT_HOST_RESERVED = new Set([
  'www',
  'api',
  'app',
  'ssh',
  'mail',
  'ftp',
  'admin',
  'gestao',
  'gestao-app',
  'static',
  'assets',
  'cdn',
  'status',
  'monitor',
  'beta',
  'docs',
  'support',
  'suporte',
  'help',
  'billing',
  'pagamento',
  'webhook',
  'webhooks',
  'login',
  'cadastro',
  'comunikapp',
]);

export function stripPort(host: string): string {
  return host.split(':')[0]?.toLowerCase().trim() ?? '';
}

/**
 * Extrai slug de tenant do Host.
 * Retorna null para apex, www, reservados ou formato inválido.
 */
export function extractTenantSlugFromHost(
  hostHeader: string | null | undefined,
): string | null {
  if (!hostHeader) return null;
  const host = stripPort(hostHeader);
  if (!host || APEX_HOSTS.has(host)) return null;
  if (!host.endsWith(TENANT_HOST_SUFFIX)) return null;

  const slug = host.slice(0, -TENANT_HOST_SUFFIX.length);
  if (!slug || slug.includes('.') || TENANT_HOST_RESERVED.has(slug)) {
    return null;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

export function isApexHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false;
  return APEX_HOSTS.has(stripPort(hostHeader));
}

export function buildCanonicalLojaUrl(slug: string): string {
  return `https://${slug}.comunikapp.com.br`;
}
