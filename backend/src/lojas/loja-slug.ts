/** Slugs que nunca podem ser atribuídos a uma loja. */
export const LOJA_SLUG_RESERVADOS = new Set([
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
  'uat',
  'api-uat',
]);

export const LOJA_SLUG_MIN = 3;
export const LOJA_SLUG_MAX = 48;
export const LOJA_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeLojaSlugCandidate(raw: string): string {
  const semAcento = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return semAcento
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LOJA_SLUG_MAX);
}

/** Junta palavras sem hífen: "Cacau Placas" → "cacauplacas". */
export function compactLojaSlugFromNome(nome: string): string {
  const semAcento = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return semAcento.replace(/[^a-z0-9]+/g, '').slice(0, LOJA_SLUG_MAX);
}

export function isProvisionalLojaSlug(slug: string | null | undefined): boolean {
  return Boolean(slug && /^loja-[a-z0-9]+$/i.test(slug));
}

export function isValidLojaSlug(slug: string): boolean {
  if (!slug || slug.length < LOJA_SLUG_MIN || slug.length > LOJA_SLUG_MAX) {
    return false;
  }
  if (!LOJA_SLUG_REGEX.test(slug)) return false;
  if (LOJA_SLUG_RESERVADOS.has(slug)) return false;
  return true;
}

export function buildCanonicalLojaUrl(slug: string): string {
  return `https://${slug}.comunikapp.com.br`;
}

/**
 * Gera slug a partir do nome (preferência: compacto, ex. cacauplacas).
 * Se inválido/reservado, tenta com hífens; senão usa loja-{idCurto}.
 */
export function suggestLojaSlugFromNome(nome: string, lojaId: string): string {
  const compact = compactLojaSlugFromNome(nome);
  if (isValidLojaSlug(compact)) return compact;

  const hyphenated = normalizeLojaSlugCandidate(nome);
  if (isValidLojaSlug(hyphenated)) return hyphenated;

  const shortId = lojaId.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase();
  const fallback = `loja-${shortId || 'nova'}`;
  return fallback.slice(0, LOJA_SLUG_MAX);
}

export function nextSlugOnCollision(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  const suffix = `-${attempt}`;
  const maxBase = LOJA_SLUG_MAX - suffix.length;
  return `${base.slice(0, Math.max(1, maxBase))}${suffix}`;
}
