'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { catalogoModuleNav } from '@/lib/module-nav';

export default function CatalogoLayout({ children }: { children: ReactNode }) {
  return <ModuleLayoutShell nav={catalogoModuleNav}>{children}</ModuleLayoutShell>;
}
