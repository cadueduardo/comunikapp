'use client';

import { type ReactNode } from 'react';
import {
  MODULE_BOTTOM_NAV_PADDING_CLASS,
  ModuleBottomNav,
} from '@/components/layout/ModuleBottomNav';
import {
  shouldShowModuleSectionNav,
  type ModuleNavConfig,
} from '@/lib/module-nav';
import { cn } from '@/lib/utils';

type ModuleLayoutShellProps = {
  nav: ModuleNavConfig;
  children: ReactNode;
  className?: string;
};

/**
 * Shell do módulo: padding + ModuleBottomNav somente se houver 2+ seções.
 * Use no layout.tsx de cada módulo.
 */
export function ModuleLayoutShell({
  nav,
  children,
  className,
}: ModuleLayoutShellProps) {
  const showSectionNav = shouldShowModuleSectionNav(nav);

  return (
    <div
      className={cn(showSectionNav && MODULE_BOTTOM_NAV_PADDING_CLASS, className)}
    >
      {children}
      {showSectionNav ? <ModuleBottomNav nav={nav} /> : null}
    </div>
  );
}
