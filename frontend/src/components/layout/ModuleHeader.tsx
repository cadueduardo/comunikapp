'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ModuleSubmenu } from '@/components/layout/ModuleSubmenu';
import { Button } from '@/components/ui/button';
import {
  resolveActiveModuleNavItem,
  type ModuleNavConfig,
} from '@/lib/module-nav';

type ModuleHeaderProps = {
  /** Configuração de navegação do módulo (reutilizável entre páginas). */
  nav: ModuleNavConfig;
  /**
   * Título estático da página.
   * Se omitido, usa o label do item ativo ou o label do módulo.
   */
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  /** Link opcional de "Voltar" (ex.: detalhe → lista). */
  backHref?: string;
  backLabel?: string;
};

/**
 * Header de módulo.
 * Desktop: título estático + botão "Seções" (submenu).
 * Mobile: título estático; seções via rodapé "Navegar em …" (ModuleBottomNav).
 */
export function ModuleHeader({
  nav,
  title,
  subtitle,
  icon,
  actions,
  backHref,
  backLabel = 'Voltar',
}: ModuleHeaderProps) {
  const pathname = usePathname();
  const active = resolveActiveModuleNavItem(nav.items, pathname, nav.homeHref);
  const displayTitle = title ?? active?.label ?? nav.label;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Button asChild variant="outline" size="sm" className="mt-1 shrink-0">
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 px-2">
            <p className="text-sm font-medium text-muted-foreground">
              {nav.label}
            </p>
            <ModuleSubmenu
              nav={nav}
              activeHref={active?.href}
              className="hidden md:inline-flex"
            />
          </div>
          <h1 className="flex items-center gap-2 px-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {icon}
            <span className="min-w-0 break-words">{displayTitle}</span>
          </h1>
          {subtitle ? (
            <p className="mt-1 px-2 text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
