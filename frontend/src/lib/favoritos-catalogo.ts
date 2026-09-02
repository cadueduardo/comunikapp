import {
  MODULE_NAV_REGISTRY,
  getNavigableModuleNavItems,
  type ModuleNavItem,
} from '@/lib/module-nav';

export type DestinoFavorito = {
  id: string;
  moduloId: string;
  label: string;
  href: string;
  item: ModuleNavItem;
};

export function listarDestinosFavorito(): DestinoFavorito[] {
  const destinos: DestinoFavorito[] = [];
  for (const nav of Object.values(MODULE_NAV_REGISTRY)) {
    if (nav.id === 'orcamentos' || nav.id === 'clientes') continue;
    for (const item of getNavigableModuleNavItems(nav.items)) {
      destinos.push({
        id: `${nav.id}:${item.id}`,
        moduloId: nav.id,
        label: item.label,
        href: item.href,
        item,
      });
    }
  }
  return destinos;
}

export function destinoFavoritoPorId(id: string): DestinoFavorito | undefined {
  return listarDestinosFavorito().find((destino) => destino.id === id);
}
