export const REFERENCIA_ANEXO_INSTALACAO_REGEX =
  /^(\/instalacao\/anexos\/[0-9a-f-]{36}|\/api\/instalacao\/anexos\/[0-9a-f-]{36}|https?:\/\/.+)$/i;

export const REFERENCIA_ASSINATURA_LOTE_REGEX =
  /^(\/instalacao\/anexos\/[0-9a-f-]{36}|\/expedicao\/assinaturas\/[0-9a-f-]{36}|\/api\/instalacao\/anexos\/[0-9a-f-]{36}|https?:\/\/.+)$/i;

export function isReferenciaAnexoInstalacao(valor: string): boolean {
  return REFERENCIA_ANEXO_INSTALACAO_REGEX.test(valor);
}

export function extrairTokenAnexoInstalacao(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:\/instalacao\/anexos|\/api\/instalacao\/anexos)\/([0-9a-f-]{36})$/i,
  );
  return match?.[1] ?? null;
}

export function extrairTokenAssinaturaExpedicao(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const match = url.match(/\/expedicao\/assinaturas\/([0-9a-f-]{36})$/i);
  return match?.[1] ?? null;
}
