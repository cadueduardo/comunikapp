import type { ModuleNavItem } from './types';

function normalizePath(path: string): string {
  if (!path) return '/';
  const trimmed = path.replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : '/';
}

/**
 * Resolve o item ativo do submenu pelo pathname.
 * A home do módulo só casa com match exato; demais itens usam prefixo
 * (ex.: /financeiro/contas-pagar/abc → Contas a pagar).
 */
export function resolveActiveModuleNavItem(
  items: ModuleNavItem[],
  pathname: string,
  homeHref: string,
): ModuleNavItem | undefined {
  const current = normalizePath(pathname);
  const home = normalizePath(homeHref);

  const matches = items
    .filter((item) => !item.disabled)
    .filter((item) => {
      const href = normalizePath(item.href);
      if (href === home) {
        return current === href;
      }
      return current === href || current.startsWith(`${href}/`);
    })
    .sort((a, b) => normalizePath(b.href).length - normalizePath(a.href).length);

  return matches[0];
}
