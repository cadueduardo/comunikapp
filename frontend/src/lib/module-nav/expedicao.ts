import { Archive, LayoutDashboard, Truck } from 'lucide-react';
import type { ModuleNavConfig } from './types';

export const expedicaoModuleNav: ModuleNavConfig = {
  id: 'expedicao',
  label: 'Expedição',
  homeHref: '/expedicao',
  items: [
    {
      id: 'fila',
      label: 'Fila de expedição',
      shortLabel: 'Fila',
      href: '/expedicao',
      description: 'Kanban e fila operacional.',
      icon: Truck,
    },
    {
      id: 'arquivo',
      label: 'Arquivo',
      shortLabel: 'Arquivo',
      href: '/expedicao/arquivo',
      description: 'Expedições concluídas e histórico.',
      icon: Archive,
    },
  ],
};
