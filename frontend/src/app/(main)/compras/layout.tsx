'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { comprasModuleNav } from '@/lib/module-nav';

export default function ComprasLayout({ children }: { children: ReactNode }) {
  return <ModuleLayoutShell nav={comprasModuleNav}>{children}</ModuleLayoutShell>;
}
