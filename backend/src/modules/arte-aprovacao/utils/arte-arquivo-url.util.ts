export function buildArteVersaoDownloadPath(
  versaoId: string,
  storedFileName: string,
): string {
  return `/arte-aprovacao/versoes/${versaoId}/arquivos/download/${encodeURIComponent(storedFileName)}`;
}
