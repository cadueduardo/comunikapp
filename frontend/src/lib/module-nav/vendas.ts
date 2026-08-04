import {
  Calculator,
  ClipboardPlus,
  FileText,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import type { ModuleNavConfig, ModuleNavItem } from './types';

/**
 * Navegação canônica do módulo Vendas (Fase 3).
 * Orçamentos e Clientes deixam de ser módulos globais na sidebar e passam
 * a ser seções deste hub. Rotas `/orcamentos-v2` e `/clientes` permanecem
 * como aliases compatíveis (bookmarks e links internos).
 */
export const vendasModuleNav: ModuleNavConfig = {
  id: 'vendas',
  label: 'Vendas',
  homeHref: '/vendas',
  items: [
    {
      id: 'visao-geral',
      label: 'Visão geral',
      shortLabel: 'Geral',
      href: '/vendas',
      description: 'Hub comercial com atalhos para propostas e clientes.',
      icon: LayoutDashboard,
    },
    {
      id: 'orcamentos',
      label: 'Orçamentos',
      shortLabel: 'Orçamentos',
      href: '/orcamentos-v2',
      description: 'Lista e criação de propostas comerciais.',
      icon: FileText,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      shortLabel: 'Clientes',
      href: '/clientes',
      description: 'Cadastro mestre de clientes da loja.',
      icon: Users,
    },
    {
      id: 'simulador',
      label: 'Simulador',
      shortLabel: 'Simulador',
      href: '/orcamentos-v2/simulador',
      description: 'Simulação de cálculo sem gravar proposta.',
      icon: Calculator,
    },
    {
      id: 'aditivos',
      label: 'Aditivos',
      shortLabel: 'Aditivos',
      href: '/vendas/aditivos',
      description: 'Ocorrências de instalação pendentes de precificação.',
      icon: ClipboardPlus,
    },
  ],
};

/** Remove Aditivos da nav quando a loja não habilita OS aditiva. */
export function filtrarVendasNavPorConfig(
  nav: ModuleNavConfig,
  opcoes: { aditivosHabilitados: boolean },
): ModuleNavConfig {
  const items: ModuleNavItem[] = nav.items.filter((item) => {
    if (item.id === 'aditivos') {
      return opcoes.aditivosHabilitados;
    }
    return true;
  });
  return { ...nav, items };
}
