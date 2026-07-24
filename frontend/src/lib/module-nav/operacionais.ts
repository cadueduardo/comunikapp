import { ClipboardList, LayoutDashboard } from 'lucide-react';
import type { ModuleNavConfig } from './types';

/** Preparado para crescer — Seções/rodapé só com 2+ itens. */
export const osModuleNav: ModuleNavConfig = {
  id: 'os',
  label: 'Ordens de Serviço',
  homeHref: '/os',
  items: [
    {
      id: 'lista',
      label: 'Lista de OS',
      shortLabel: 'OS',
      href: '/os',
      description: 'Ordens de serviço da loja.',
      icon: ClipboardList,
    },
  ],
};

export const arteModuleNav: ModuleNavConfig = {
  id: 'arte',
  label: 'Arte & Aprovação',
  homeHref: '/arte',
  items: [
    {
      id: 'fila',
      label: 'Fila de arte',
      shortLabel: 'Fila',
      href: '/arte',
      description: 'Kanban de arte e aprovação.',
      icon: LayoutDashboard,
    },
  ],
};

export const instalacaoModuleNav: ModuleNavConfig = {
  id: 'instalacao',
  label: 'Instalações',
  homeHref: '/instalacao',
  items: [
    {
      id: 'agenda',
      label: 'Agenda',
      shortLabel: 'Agenda',
      href: '/instalacao',
      description: 'Agenda e gestão de instalações.',
      icon: LayoutDashboard,
    },
  ],
};

export const fornecedoresModuleNav: ModuleNavConfig = {
  id: 'fornecedores',
  label: 'Fornecedores',
  homeHref: '/fornecedores',
  items: [
    {
      id: 'lista',
      label: 'Fornecedores',
      shortLabel: 'Lista',
      href: '/fornecedores',
      description: 'Cadastro de fornecedores e parceiros.',
      icon: LayoutDashboard,
    },
  ],
};

export const insumosModuleNav: ModuleNavConfig = {
  id: 'insumos',
  label: 'Insumos',
  homeHref: '/insumos',
  items: [
    {
      id: 'lista',
      label: 'Insumos',
      shortLabel: 'Lista',
      href: '/insumos',
      description: 'Cadastro de insumos.',
      icon: LayoutDashboard,
    },
  ],
};

export const orcamentosModuleNav: ModuleNavConfig = {
  id: 'orcamentos',
  label: 'Orçamentos',
  homeHref: '/orcamentos-v2',
  items: [
    {
      id: 'lista',
      label: 'Orçamentos',
      shortLabel: 'Lista',
      href: '/orcamentos-v2',
      description: 'Lista e criação de orçamentos.',
      icon: LayoutDashboard,
    },
    {
      id: 'simulador',
      label: 'Simulador',
      shortLabel: 'Simulador',
      href: '/orcamentos-v2/simulador',
      description: 'Simulação de cálculo.',
      icon: LayoutDashboard,
    },
  ],
};

export const modelosModuleNav: ModuleNavConfig = {
  id: 'modelos',
  label: 'Modelos de Orçamento',
  homeHref: '/produtos',
  items: [
    {
      id: 'lista',
      label: 'Modelos',
      shortLabel: 'Modelos',
      href: '/produtos',
      description: 'Modelos de orçamento / produtos template.',
      icon: LayoutDashboard,
    },
  ],
};

export const clientesModuleNav: ModuleNavConfig = {
  id: 'clientes',
  label: 'Clientes',
  homeHref: '/clientes',
  items: [
    {
      id: 'lista',
      label: 'Clientes',
      shortLabel: 'Lista',
      href: '/clientes',
      description: 'Cadastro de clientes.',
      icon: LayoutDashboard,
    },
  ],
};
