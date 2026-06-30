export function extrairTokenAnexoInstalacao(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/\/instalacao\/anexos\/([0-9a-f-]{36})$/i);
  return match?.[1] ?? null;
}

export function extrairTokenAssinaturaExpedicao(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const match = url.match(/\/expedicao\/assinaturas\/([0-9a-f-]{36})$/i);
  return match?.[1] ?? null;
}
