/**
 * Remove tags HTML e normaliza texto livre de ocorrências/comentários de campo.
 */
export function sanitizarTextoCampo(valor: string, maxLength = 5000): string {
  const semTags = valor.replace(/<[^>]*>/g, '');
  const semScripts = semTags.replace(/javascript:/gi, '');
  return semScripts.trim().slice(0, maxLength);
}
