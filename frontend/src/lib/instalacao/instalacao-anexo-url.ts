/**
 * Converte URL relativa do backend (/instalacao/anexos/<token>)
 * em rota BFF autenticável para exibição no browser.
 */
export function resolverUrlAnexoInstalacao(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  const match = url.match(
    /(?:\/instalacao\/anexos|\/api\/instalacao\/anexos)\/([0-9a-f-]{36})$/i,
  );
  if (match?.[1]) {
    return `/api/instalacao/anexos/${match[1]}`;
  }

  return url;
}

export function resolverUrlsAnexos(urls: string[]): string[] {
  return urls.map(resolverUrlAnexoInstalacao);
}
