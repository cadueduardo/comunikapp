import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calculator,
  LayoutDashboard,
} from 'lucide-react';
import type { ModuleNavConfig } from './types';

export const financeiroModuleNav: ModuleNavConfig = {
  id: 'financeiro',
  label: 'Financeiro',
  homeHref: '/financeiro',
  items: [
    {
      id: 'visao-geral',
      label: 'Visão geral',
      shortLabel: 'Geral',
      href: '/financeiro',
      description: 'Panorama de caixa, obrigações e atalhos da área.',
      icon: LayoutDashboard,
    },
    {
      id: 'contas-receber',
      label: 'Contas a receber',
      shortLabel: 'Receber',
      href: '/financeiro/recebimentos',
      description: 'Cobranças, parcelas, vencimentos e recebimentos.',
      icon: ArrowDownLeft,
    },
    {
      id: 'contas-pagar',
      label: 'Contas a pagar',
      shortLabel: 'Pagar',
      href: '/financeiro/contas-pagar',
      description: 'Obrigações com fornecedores e pagamentos.',
      icon: ArrowUpRight,
    },
    {
      id: 'pos-calculo',
      label: 'Pós-cálculo (OS)',
      shortLabel: 'Pós-cálculo',
      href: '/financeiro/pos-calculo',
      description: 'Previsto × real por OS, margens e fechamento.',
      icon: Calculator,
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      shortLabel: 'Relatórios',
      href: '/financeiro/relatorios',
      description: 'Visões consolidadas de caixa e inadimplência.',
      icon: BarChart3,
      disabled: true,
      badge: 'Em breve',
    },
  ],
};
