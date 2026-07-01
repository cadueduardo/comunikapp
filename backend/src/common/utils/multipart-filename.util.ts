/** Padrão típico de UTF-8 interpretado como Latin-1 (ex.: Ã§, Ã£, Ãº). */
const MOJIBAKE_UTF8_PATTERN = /[\u00C2-\u00C3][\u0080-\u00BF]/;

/**
 * Corrige nomes de arquivo vindos de multipart/form-data (Multer/busboy).
 * Quando o cliente envia UTF-8, o backend costuma decodificar como Latin-1.
 */
export function normalizeMultipartFilename(
  filename: string | undefined | null,
): string {
  if (!filename?.trim()) {
    return filename ?? '';
  }

  const trimmed = filename.trim();

  if (!MOJIBAKE_UTF8_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const corrected = Buffer.from(trimmed, 'latin1').toString('utf8');
    if (corrected && !corrected.includes('\uFFFD')) {
      return corrected;
    }
  } catch {
    // mantém o original
  }

  return trimmed;
}
