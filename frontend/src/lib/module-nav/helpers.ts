import type { ModuleNavConfig, ModuleNavItem } from './types';

/** Itens navegáveis (ignora disabled / em breve). */
export function getNavigableModuleNavItems(
  items: ModuleNavItem[],
): ModuleNavItem[] {
  return items.filter((item) => !item.disabled);
}

/**
 * Seções / rodapé só aparecem com 2+ itens navegáveis.
 * Módulo com só "Visão geral" fica preparado na config sem poluir a UI.
 */
export function shouldShowModuleSectionNav(nav: ModuleNavConfig): boolean {
  return getNavigableModuleNavItems(nav.items).length >= 2;
}

/** Cards da home: tudo exceto a própria visão geral. Inclui disabled (Em breve). */
export function getModuleHubCardItems(nav: ModuleNavConfig): ModuleNavItem[] {
  const home = nav.homeHref.replace(/\/+$/, '') || '/';
  return nav.items.filter((item) => {
    const href = item.href.replace(/\/+$/, '') || '/';
    return href !== home;
  });
}
