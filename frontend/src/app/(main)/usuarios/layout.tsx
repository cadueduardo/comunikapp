'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { usuariosModuleNav } from '@/lib/module-nav';

export default function UsuariosLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleLayoutShell nav={usuariosModuleNav}>{children}</ModuleLayoutShell>
  );
}
