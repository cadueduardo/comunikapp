'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { VendasAccessGate } from '@/components/vendas/VendasAccessGate';
import { useVendasNavFiltrado } from '@/hooks/use-vendas-nav-filtrado';

/**
 * Orçamentos V2 permanece em `/orcamentos-v2` (alias compatível).
 * A navegação de seções passa a ser a do módulo Vendas.
 */
export default function OrcamentosLayout({ children }: { children: ReactNode }) {
  const { nav } = useVendasNavFiltrado();
  return (
    <VendasAccessGate>
      <ModuleLayoutShell nav={nav}>{children}</ModuleLayoutShell>
    </VendasAccessGate>
  );
}
