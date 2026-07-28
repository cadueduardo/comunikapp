/**
 * Heurística MVP Fatia D: só subdomínio do cliente (não apex).
 * - example.com → apex
 * - loja.com.br / loja.co.uk → apex (SLD conhecido + ccTLD)
 * - sistema.loja.com.br / app.cliente.com → subdomínio OK
 */
export function isLikelyApexHostname(host: string): boolean {
  const parts = host.toLowerCase().split('.').filter(Boolean);
  if (parts.length < 2) return true;
  if (parts.length === 2) return true;
  if (parts.length === 3) {
    const sld = parts[1];
    const tld = parts[2];
    if (
      ['com', 'net', 'org', 'co', 'gov', 'edu', 'ind'].includes(sld) &&
      tld.length === 2
    ) {
      return true;
    }
    return false;
  }
  return false;
}

export function assertCustomHostnameIsSubdomain(host: string): void {
  if (isLikelyApexHostname(host)) {
    throw new Error('APEX_NOT_SUPPORTED');
  }
}
