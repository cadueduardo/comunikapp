'use client';

import { type ReactNode } from 'react';
import {
  MODULE_BOTTOM_NAV_PADDING_CLASS,
  ModuleBottomNav,
} from '@/components/layout/ModuleBottomNav';
import type { ModuleNavConfig } from '@/lib/module-nav';
import { cn } from '@/lib/utils';

type ModuleLayoutShellProps = {
  nav: ModuleNavConfig;
  children: ReactNode;
  className?: string;
};

/**
 * Shell do módulo: reserva espaço no mobile para o rodapé
 * "Navegar em …" e monta o ModuleBottomNav. Use no layout.tsx de cada módulo.
 */
export function ModuleLayoutShell({
  nav,
  children,
  className,
}: ModuleLayoutShellProps) {
  return (
    <div className={cn(MODULE_BOTTOM_NAV_PADDING_CLASS, className)}>
      {children}
      <ModuleBottomNav nav={nav} />
    </div>
  );
}
