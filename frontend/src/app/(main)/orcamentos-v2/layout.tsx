'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { orcamentosModuleNav } from '@/lib/module-nav';

export default function OrcamentosLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleLayoutShell nav={orcamentosModuleNav}>{children}</ModuleLayoutShell>
  );
}
