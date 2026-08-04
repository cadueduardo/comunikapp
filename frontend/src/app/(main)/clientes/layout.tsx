'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { VendasAccessGate } from '@/components/vendas/VendasAccessGate';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';

/** Clientes permanece em `/clientes` (alias) dentro do shell de Vendas. */
export default function ClientesLayout({ children }: { children: ReactNode }) {
  const { nav } = useVendasNavFiltrado();
  return (
    <VendasAccessGate>
      <ModuleLayoutShell nav={nav}>{children}</ModuleLayoutShell>
    </VendasAccessGate>
  );
}
