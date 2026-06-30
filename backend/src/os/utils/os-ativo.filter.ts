/** Filtro padrão: apenas OS ativas nas filas operacionais. */
export const FILTRO_OS_ATIVA = { ativo: true } as const;

export function mesclarFiltroOsAtiva<T extends Record<string, unknown>>(
  where: T,
): T & { ativo: true } {
  return { ...where, ativo: true };
}
