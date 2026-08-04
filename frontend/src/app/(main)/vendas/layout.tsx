'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';

export default function VendasLayout({ children }: { children: ReactNode }) {
  const { nav } = useVendasNavFiltrado();
  return <ModuleLayoutShell nav={nav}>{children}</ModuleLayoutShell>;
}
