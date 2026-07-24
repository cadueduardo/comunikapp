import { LayoutDashboard, Shield, Users } from 'lucide-react';
import type { ModuleNavConfig } from './types';

export const usuariosModuleNav: ModuleNavConfig = {
  id: 'usuarios',
  label: 'Usuários',
  homeHref: '/usuarios',
  items: [
    {
      id: 'visao-geral',
      label: 'Visão geral',
      shortLabel: 'Geral',
      href: '/usuarios',
      description: 'Escolha o recurso de usuários.',
      icon: LayoutDashboard,
    },
    {
      id: 'gestao',
      label: 'Gestão de usuários',
      shortLabel: 'Usuários',
      href: '/usuarios/gestao',
      description: 'Gerencie usuários da loja.',
      icon: Users,
    },
    {
      id: 'perfis',
      label: 'Gestão de perfis',
      shortLabel: 'Perfis',
      href: '/usuarios/perfis',
      description: 'Perfis e permissões.',
      icon: Shield,
    },
  ],
};
