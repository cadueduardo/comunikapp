import type { ReactNode } from 'react';
import {
  IconBuilding,
  IconBuildingWarehouse,
  IconBuildingStore,
  IconCash,
  IconCategory,
  IconClipboardList,
  IconFileText,
  IconLayoutDashboard,
  IconMapPin,
  IconPackage,
  IconPalette,
  IconShoppingCart,
  IconTools,
  IconTruckDelivery,
  IconUsers,
} from '@tabler/icons-react';

export type SidebarMenuItemId =
  | 'dashboard'
  | 'vendas'
  /** @deprecated Preferir `vendas` — mantido só para migrar ordem salva. */
  | 'orcamentos'
  /** @deprecated Preferir `vendas` — mantido só para migrar ordem salva. */
  | 'clientes'
  | 'insumos'
  | 'fornecedores'
  | 'compras'
  | 'estoque'
  | 'modelos'
  | 'catalogo'
  | 'os'
  | 'arte'
  | 'financeiro'
  | 'pcp'
  | 'expedicao'
  | 'instalacao'
  | 'centros-trabalho'
  | 'usuarios';

export const SIDEBAR_MENU_DEFAULT_ORDER: SidebarMenuItemId[] = [
  'dashboard',
  'vendas',
  'insumos',
  'fornecedores',
  'compras',
  'estoque',
  'modelos',
  'catalogo',
  'os',
  'arte',
  'financeiro',
  'pcp',
  'expedicao',
  'instalacao',
  'centros-trabalho',
  'usuarios',
];

export interface SidebarMenuPermissions {
  /** Fonte: backend `GET /vendas/acesso` e `GET /usuarios/me/acesso`. */
  podeVerVendas: boolean;
  podeVerFinanceiro: boolean;
  podeVerExpedicao: boolean;
  podeVerInstalacaoGestao: boolean;
  podeVerInsumos?: boolean;
  podeVerFornecedores?: boolean;
  podeVerCompras?: boolean;
  podeVerEstoque?: boolean;
  podeVerModelos?: boolean;
  podeVerCatalogo?: boolean;
  podeVerOs?: boolean;
  podeVerArte?: boolean;
  podeVerPcp?: boolean;
  podeVerCentrosTrabalho?: boolean;
  podeVerUsuarios?: boolean;
}

export interface SidebarMenuContadores {
  os: number;
  arte: number;
  financeiro: number;
  pcp: number;
  expedicao: number;
  instalacao: number;
}

export interface SidebarNavItem {
  id: SidebarMenuItemId;
  label: string;
  href: string;
  icon: ReactNode;
  badgeCount?: number;
}

const iconClass =
  'text-neutral-700 dark:text-neutral-200 h-[18px] w-[18px] flex-shrink-0';

export function buildSidebarNavItems(
  permissions: SidebarMenuPermissions,
  contadores: SidebarMenuContadores,
): SidebarNavItem[] {
  const items: SidebarNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: <IconLayoutDashboard className={iconClass} />,
    },
  ];

  if (permissions.podeVerVendas) {
    items.push({
      id: 'vendas',
      label: 'Vendas',
      href: '/vendas',
      icon: <IconFileText className={iconClass} />,
    });
  }

  items.push(
    ...(permissions.podeVerInsumos === false
      ? []
      : [
          {
            id: 'insumos' as const,
            label: 'Insumos',
            href: '/insumos',
            icon: <IconBuildingWarehouse className={iconClass} />,
          },
        ]),
    ...(permissions.podeVerFornecedores === false
      ? []
      : [
          {
            id: 'fornecedores' as const,
            label: 'Fornecedores',
            href: '/fornecedores',
            icon: <IconBuildingStore className={iconClass} />,
          },
        ]),
    ...(permissions.podeVerCompras === false
      ? []
      : [
          {
            id: 'compras' as const,
            label: 'Compras',
            href: '/compras',
            icon: <IconShoppingCart className={iconClass} />,
          },
        ]),
    ...(permissions.podeVerEstoque === false
      ? []
      : [
          {
            id: 'estoque' as const,
            label: 'Estoque',
            href: '/estoque',
            icon: <IconBuildingWarehouse className={iconClass} />,
          },
        ]),
    ...(permissions.podeVerModelos === false
      ? []
      : [
          {
            id: 'modelos' as const,
            label: 'Modelos de Orçamento',
            href: '/produtos',
            icon: <IconPackage className={iconClass} />,
          },
        ]),
    ...(permissions.podeVerCatalogo === false
      ? []
      : [
          {
            id: 'catalogo' as const,
            label: 'Catálogo de produtos',
            href: '/catalogo',
            icon: <IconCategory className={iconClass} />,
          },
        ]),
    ...(permissions.podeVerOs === false
      ? []
      : [
          {
            id: 'os' as const,
            label: 'Ordens de Serviço',
            href: '/os',
            badgeCount: contadores.os,
            icon: <IconClipboardList className={iconClass} />,
          },
        ]),
    ...(permissions.podeVerArte === false
      ? []
      : [
          {
            id: 'arte' as const,
            label: 'Arte & Aprovação',
            href: '/arte',
            badgeCount: contadores.arte,
            icon: <IconPalette className={iconClass} />,
          },
        ]),
  );

  // VENDAS não recebe Financeiro (critério RP 8.1 / Fase 3).
  if (permissions.podeVerFinanceiro) {
    items.push({
      id: 'financeiro',
      label: 'Financeiro',
      href: '/financeiro',
      badgeCount: contadores.financeiro,
      icon: <IconCash className={iconClass} />,
    });
  }

  if (permissions.podeVerPcp !== false) {
    items.push({
      id: 'pcp',
      label: 'PCP',
      href: '/pcp',
      badgeCount: contadores.pcp,
      icon: <IconBuilding className={iconClass} />,
    });
  }

  if (permissions.podeVerExpedicao) {
    items.push({
      id: 'expedicao',
      label: 'Expedição',
      href: '/expedicao',
      badgeCount: contadores.expedicao,
      icon: <IconTruckDelivery className={iconClass} />,
    });
  }

  if (permissions.podeVerInstalacaoGestao) {
    items.push({
      id: 'instalacao',
      label: 'Instalações',
      href: '/instalacao',
      badgeCount: contadores.instalacao,
      icon: <IconMapPin className={iconClass} />,
    });
  }

  if (permissions.podeVerCentrosTrabalho !== false) {
    items.push({
      id: 'centros-trabalho',
      label: 'Centros de Trabalho',
      href: '/centros-de-trabalho',
      icon: <IconTools className={iconClass} />,
    });
  }

  if (permissions.podeVerUsuarios) {
    items.push({
      id: 'usuarios',
      label: 'Usuários',
      href: '/usuarios',
      icon: <IconUsers className={iconClass} />,
    });
  }

  return items;
}

/**
 * Migra ordem persistida: `orcamentos`/`clientes` → `vendas` na primeira
 * ocorrência, sem duplicar.
 */
export function migrateSidebarOrderIds(savedOrder: string[]): string[] {
  const out: string[] = [];
  let vendasInserido = false;

  for (const id of savedOrder) {
    if (id === 'orcamentos' || id === 'clientes') {
      if (!vendasInserido) {
        out.push('vendas');
        vendasInserido = true;
      }
      continue;
    }
    if (id === 'vendas') {
      if (!vendasInserido) {
        out.push('vendas');
        vendasInserido = true;
      }
      continue;
    }
    out.push(id);
  }

  return out;
}

export function mergeSidebarOrder(
  savedOrder: string[],
  availableIds: string[],
): string[] {
  const migrated = migrateSidebarOrderIds(savedOrder);
  const validSaved = migrated.filter((id) => availableIds.includes(id));
  const missing = availableIds.filter((id) => !validSaved.includes(id));
  return [...validSaved, ...missing];
}

export function storageKeySidebarOrder(userId: string) {
  return `comunikapp:sidebar-menu-order:${userId}`;
}
