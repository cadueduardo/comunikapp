/**
 * Parse de host/origin tenant (espelho do frontend).
 */
export const APEX_HOSTS = new Set([
  'comunikapp.com.br',
  'www.comunikapp.com.br',
]);

export const TENANT_HOST_SUFFIX = '.comunikapp.com.br';

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

export function extractTenantSlugFromOrigin(
  origin: string | null | undefined,
): string | null {
  if (!origin) return null;
  try {
    return extractTenantSlugFromHost(new URL(origin).host);
  } catch {
    return null;
  }
}

/** True se Origin for apex, www ou https://{slug}.comunikapp.com.br válido. */
export function isAllowedComunikappOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:') return false;
    const host = stripPort(url.host);
    if (APEX_HOSTS.has(host)) return true;
    return extractTenantSlugFromHost(host) !== null;
  } catch {
    return false;
  }
}
