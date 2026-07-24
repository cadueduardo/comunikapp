'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { expedicaoModuleNav } from '@/lib/module-nav';

export default function ExpedicaoLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleLayoutShell nav={expedicaoModuleNav}>{children}</ModuleLayoutShell>
  );
}
