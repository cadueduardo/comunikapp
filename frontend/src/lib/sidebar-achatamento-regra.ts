/** Espelha `deveAchatarModulo` em backend/src/home-operacional/home-visibilidade.ts */

/**
 * Só explode seções na sidebar quando o perfil vê um único módulo
 * funcional. Admin e gestor com vários módulos permanecem com hub.
 */
export function deveAchatarModulo(
  secoesAlemDaHome: number,
  modulosFuncionais: number,
): boolean {
  if (secoesAlemDaHome < 1) return false;
  return modulosFuncionais === 1;
}
