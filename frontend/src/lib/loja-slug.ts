/**
 * Espelho leve de backend/src/lojas/loja-slug.ts para sugestão na UI.
 * Manter alinhado à regra de sugestão compacta (ex.: Cacau Placas → cacauplacas).
 */

const LOJA_SLUG_MIN = 3;
const LOJA_SLUG_MAX = 48;
const LOJA_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOJA_SLUG_RESERVADOS = new Set([
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

function isValidLojaSlug(slug: string): boolean {
  if (!slug || slug.length < LOJA_SLUG_MIN || slug.length > LOJA_SLUG_MAX) {
    return false;
  }
  if (!LOJA_SLUG_REGEX.test(slug)) return false;
  if (LOJA_SLUG_RESERVADOS.has(slug)) return false;
  return true;
}

function compactLojaSlugFromNome(nome: string): string {
  const semAcento = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return semAcento.replace(/[^a-z0-9]+/g, '').slice(0, LOJA_SLUG_MAX);
}

function normalizeHyphenated(raw: string): string {
  const semAcento = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return semAcento
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LOJA_SLUG_MAX);
}

export function isProvisionalLojaSlug(slug: string | null | undefined): boolean {
  return Boolean(slug && /^loja-[a-z0-9]+$/i.test(slug));
}

/** Sugestão preferencial a partir do nome de exibição da loja. */
export function suggestLojaSlugFromNome(
  nome: string,
  lojaId = 'nova',
): string {
  const compact = compactLojaSlugFromNome(nome);
  if (isValidLojaSlug(compact)) return compact;

  const hyphenated = normalizeHyphenated(nome);
  if (isValidLojaSlug(hyphenated)) return hyphenated;

  const shortId = lojaId.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase();
  return `loja-${shortId || 'nova'}`.slice(0, LOJA_SLUG_MAX);
}
