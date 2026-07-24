'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { centrosTrabalhoModuleNav } from '@/lib/module-nav';

export default function CentrosDeTrabalhoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ModuleLayoutShell nav={centrosTrabalhoModuleNav}>
      {children}
    </ModuleLayoutShell>
  );
}
