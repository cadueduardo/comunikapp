import { ClipboardList, LayoutDashboard, ShoppingCart } from 'lucide-react';
import type { ModuleNavConfig } from './types';

export const comprasModuleNav: ModuleNavConfig = {
  id: 'compras',
  label: 'Compras',
  homeHref: '/compras',
  items: [
    {
      id: 'visao-geral',
      label: 'Visão geral',
      shortLabel: 'Geral',
      href: '/compras',
      description: 'Atalhos de solicitações, pedidos e recebimentos.',
      icon: LayoutDashboard,
    },
    {
      id: 'solicitacoes',
      label: 'Solicitações',
      shortLabel: 'Solicitações',
      href: '/compras/solicitacoes',
      description: 'Necessidades internas e conversão em pedidos.',
      icon: ClipboardList,
    },
    {
      id: 'pedidos',
      label: 'Pedidos',
      shortLabel: 'Pedidos',
      href: '/compras/pedidos',
      description: 'Pedidos, recebimento de material e aceite de serviço.',
      icon: ShoppingCart,
    },
  ],
};
