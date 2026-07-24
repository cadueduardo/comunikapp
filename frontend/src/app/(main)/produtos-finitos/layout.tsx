'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { catalogoModuleNav } from '@/lib/module-nav';

/** Produtos de prateleira fazem parte do Catálogo (seção externa à pasta). */
export default function ProdutosFinitosLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ModuleLayoutShell nav={catalogoModuleNav}>{children}</ModuleLayoutShell>
  );
}
