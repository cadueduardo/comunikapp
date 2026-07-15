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
  IconTools,
  IconTruckDelivery,
  IconUsers,
} from '@tabler/icons-react';

export type SidebarMenuItemId =
  | 'dashboard'
  | 'orcamentos'
  | 'clientes'
  | 'insumos'
  | 'fornecedores'
  | 'estoque'
  | 'modelos'
  | 'catalogo'
  | 'os'
  | 'arte'
  | 'financeiro'
  | 'pcp'
  | 'expedicao'
  | 'instalacao'
  | 'centros-trabalho';

export const SIDEBAR_MENU_DEFAULT_ORDER: SidebarMenuItemId[] = [
  'dashboard',
  'orcamentos',
  'clientes',
  'insumos',
  'fornecedores',
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
];

export interface SidebarMenuPermissions {
  podeVerFinanceiro: boolean;
  podeVerExpedicao: boolean;
  podeVerInstalacaoGestao: boolean;
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
    {
      id: 'orcamentos',
      label: 'Orçamentos',
      href: '/orcamentos-v2',
      icon: <IconFileText className={iconClass} />,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      href: '/clientes',
      icon: <IconUsers className={iconClass} />,
    },
    {
      id: 'insumos',
      label: 'Insumos',
      href: '/insumos',
      icon: <IconBuildingWarehouse className={iconClass} />,
    },
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      href: '/fornecedores',
      icon: <IconBuildingStore className={iconClass} />,
    },
    {
      id: 'estoque',
      label: 'Estoque',
      href: '/estoque',
      icon: <IconBuildingWarehouse className={iconClass} />,
    },
    {
      id: 'modelos',
      label: 'Modelos de Orçamento',
      href: '/produtos',
      icon: <IconPackage className={iconClass} />,
    },
    {
      id: 'catalogo',
      label: 'Catálogo de produtos',
      href: '/catalogo',
      icon: <IconCategory className={iconClass} />,
    },
    {
      id: 'os',
      label: 'Ordens de Serviço',
      href: '/os',
      badgeCount: contadores.os,
      icon: <IconClipboardList className={iconClass} />,
    },
    {
      id: 'arte',
      label: 'Arte & Aprovação',
      href: '/arte',
      badgeCount: contadores.arte,
      icon: <IconPalette className={iconClass} />,
    },
  ];

  if (permissions.podeVerFinanceiro) {
    items.push({
      id: 'financeiro',
      label: 'Financeiro',
      href: '/financeiro/recebimentos',
      badgeCount: contadores.financeiro,
      icon: <IconCash className={iconClass} />,
    });
  }

  items.push({
    id: 'pcp',
    label: 'PCP',
    href: '/pcp',
    badgeCount: contadores.pcp,
    icon: <IconBuilding className={iconClass} />,
  });

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

  items.push({
    id: 'centros-trabalho',
    label: 'Centros de Trabalho',
    href: '/centros-de-trabalho',
    icon: <IconTools className={iconClass} />,
  });

  return items;
}

export function mergeSidebarOrder(
  savedOrder: string[],
  availableIds: string[],
): string[] {
  const validSaved = savedOrder.filter((id) => availableIds.includes(id));
  const missing = availableIds.filter((id) => !validSaved.includes(id));
  return [...validSaved, ...missing];
}

export function storageKeySidebarOrder(userId: string) {
  return `comunikapp:sidebar-menu-order:${userId}`;
}
