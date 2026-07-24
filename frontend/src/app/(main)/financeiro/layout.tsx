'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { financeiroModuleNav } from '@/lib/module-nav';

export default function FinanceiroLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ModuleLayoutShell nav={financeiroModuleNav}>{children}</ModuleLayoutShell>
  );
}
