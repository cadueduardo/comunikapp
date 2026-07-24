'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { estoqueModuleNav } from '@/lib/module-nav';

export default function EstoqueLayout({ children }: { children: ReactNode }) {
  return <ModuleLayoutShell nav={estoqueModuleNav}>{children}</ModuleLayoutShell>;
}
