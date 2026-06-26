/**
 * Controle local de "última visita" por módulo do menu lateral.
 * Badge = itens que entraram na fila do módulo DEPOIS desse instante.
 */

export type ModuloSidebarBadge = 'os' | 'pcp' | 'expedicao' | 'financeiro';

const MODULOS: ModuloSidebarBadge[] = ['os', 'pcp', 'expedicao', 'financeiro'];

const storageKey = (userId: string, modulo: ModuloSidebarBadge) =>
  `comunikapp:sidebar-visto:${userId}:${modulo}`;

export function obterVistoEm(
  userId: string,
  modulo: ModuloSidebarBadge,
): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(storageKey(userId, modulo));
}

/**
 * Garante timestamp para cada módulo. Na primeira vez do usuário, usa "agora"
 * para não exibir backlog inteiro como "novo".
 */
export function obterTimestampsVisto(
  userId: string,
): Record<ModuloSidebarBadge, string> {
  const agora = new Date().toISOString();
  const resultado = {} as Record<ModuloSidebarBadge, string>;

  for (const modulo of MODULOS) {
    const key = storageKey(userId, modulo);
    let valor = localStorage.getItem(key);
    if (!valor) {
      valor = agora;
      localStorage.setItem(key, valor);
    }
    resultado[modulo] = valor;
  }

  return resultado;
}

export function marcarModuloVisto(
  userId: string,
  modulo: ModuloSidebarBadge,
  instante: Date = new Date(),
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId, modulo), instante.toISOString());
}

/** Prefixos de rota → módulo (ordem: rotas mais específicas primeiro). */
export const ROTA_PARA_MODULO_BADGE: Array<{
  prefixo: string;
  modulo: ModuloSidebarBadge;
}> = [
  { prefixo: '/financeiro', modulo: 'financeiro' },
  { prefixo: '/expedicao', modulo: 'expedicao' },
  { prefixo: '/pcp', modulo: 'pcp' },
  { prefixo: '/os', modulo: 'os' },
];

export function resolverModuloPorPathname(
  pathname: string,
): ModuloSidebarBadge | null {
  for (const { prefixo, modulo } of ROTA_PARA_MODULO_BADGE) {
    if (pathname === prefixo || pathname.startsWith(`${prefixo}/`)) {
      return modulo;
    }
  }
  return null;
}
