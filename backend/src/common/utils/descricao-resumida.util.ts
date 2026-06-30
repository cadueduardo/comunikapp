const LIMITE_PADRAO = 200;

export function truncarDescricaoResumida(
  texto: unknown,
  limite = LIMITE_PADRAO,
): string {
  if (typeof texto !== 'string') {
    return '';
  }

  const normalizado = texto
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalizado) {
    return '';
  }

  if (normalizado.length <= limite) {
    return normalizado;
  }

  return `${normalizado.slice(0, Math.max(limite - 1, 1)).trimEnd()}…`;
}
