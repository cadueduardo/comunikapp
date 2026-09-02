/** Espelha `deveAchatarModulo` em backend/src/home-operacional/home-visibilidade.ts */
export const MAX_SECOES_ACHATAR_SEMPRE = 4;

export function deveAchatarModulo(
  secoesAlemDaHome: number,
  modulosFuncionais: number,
): boolean {
  if (secoesAlemDaHome < 1) return false;
  if (modulosFuncionais === 1) return true;
  return secoesAlemDaHome <= MAX_SECOES_ACHATAR_SEMPRE;
}
