'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  resolveActiveModuleNavItem,
  type ModuleNavConfig,
} from '@/lib/module-nav';
import { cn } from '@/lib/utils';

type ModuleBottomNavProps = {
  nav: ModuleNavConfig;
  className?: string;
};

/**
 * Navegação de seções do módulo no rodapé (mobile).
 * Itens `disabled` não aparecem. Desktop: oculto (use ModuleSubmenu).
 */
export function ModuleBottomNav({ nav, className }: ModuleBottomNavProps) {
  const pathname = usePathname();
  const active = resolveActiveModuleNavItem(nav.items, pathname, nav.homeHref);
  const items = nav.items.filter((item) => !item.disabled);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label={`Seções de ${nav.label}`}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden',
        'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const isActive = active?.href === item.href;
          const Icon = item.icon;
          const label = item.shortLabel ?? item.label;

          return (
            <li key={item.id} className="flex min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-tight',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                    aria-hidden
                  />
                ) : null}
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Altura aproximada da barra + safe area — use no padding do layout do módulo. */
export const MODULE_BOTTOM_NAV_PADDING_CLASS =
  'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0';
