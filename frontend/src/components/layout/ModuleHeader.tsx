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
 * Desktop: uma linha — título · módulo | Seções | ações (sem subtítulo).
 * Mobile: título + subtítulo; seções no rodapé (ModuleBottomNav).
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

  const backButton = backHref ? (
    <Button asChild variant="outline" size="sm" className="shrink-0">
      <Link href={backHref}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {backLabel}
      </Link>
    </Button>
  ) : null;

  return (
    <>
      {/* Mobile — layout atual (rodapé cuida da navegação) */}
      <div className="flex flex-col gap-4 md:hidden">
        <div className="flex min-w-0 items-start gap-3">
          {backButton ? <div className="mt-1">{backButton}</div> : null}
          <div className="min-w-0">
            <p className="px-2 text-sm font-medium text-muted-foreground">
              {nav.label}
            </p>
            <h1 className="flex items-center gap-2 px-2 text-2xl font-bold tracking-tight text-foreground">
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

      {/* Desktop — uma linha compacta */}
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="flex min-w-0 items-center gap-3">
          {backButton}
          <h1 className="flex min-w-0 items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            {icon}
            <span className="truncate">{displayTitle}</span>
            <span className="font-normal text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="truncate text-base font-medium text-muted-foreground">
              {nav.label}
            </span>
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ModuleSubmenu nav={nav} activeHref={active?.href} />
          {actions}
        </div>
      </div>
    </>
  );
}
