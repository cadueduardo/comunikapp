'use client';

import { type ReactNode } from 'react';
import { ModuleLayoutShell } from '@/components/layout/ModuleLayoutShell';
import { configuracoesModuleNav } from '@/lib/module-nav';

export default function ConfiguracoesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ModuleLayoutShell nav={configuracoesModuleNav}>{children}</ModuleLayoutShell>
  );
}
