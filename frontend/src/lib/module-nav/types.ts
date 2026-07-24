import type { LucideIcon } from 'lucide-react';

export type ModuleNavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
  /** Item visível mas não navegável (ex.: "Em breve"). */
  disabled?: boolean;
  badge?: string;
};

export type ModuleNavConfig = {
  id: string;
  label: string;
  /** Rota da visão geral / home do módulo. */
  homeHref: string;
  items: ModuleNavItem[];
};
