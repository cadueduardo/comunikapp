'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { pcpModuleNav } from '@/lib/module-nav';

export default function PcpLayout({ children }: { children: ReactNode }) {
  return <ModuleLayoutShell nav={pcpModuleNav}>{children}</ModuleLayoutShell>;
}
