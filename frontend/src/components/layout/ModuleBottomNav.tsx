'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Check, ChevronUp, LayoutList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  resolveActiveModuleNavItem,
  type ModuleNavConfig,
  type ModuleNavItem,
} from '@/lib/module-nav';
import { cn } from '@/lib/utils';

type ModuleBottomNavProps = {
  nav: ModuleNavConfig;
  className?: string;
};

function NavItemRow({
  item,
  isActive,
  onNavigate,
}: {
  item: ModuleNavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const content = (
    <>
      {Icon ? (
        <Icon
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0',
            isActive ? 'text-foreground' : 'text-muted-foreground',
          )}
        />
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{item.label}</span>
          {item.badge ? (
            <Badge variant="secondary" className="shrink-0 text-[10px]">
              {item.badge}
            </Badge>
          ) : null}
        </span>
        {item.description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </span>
        ) : null}
      </span>
      {isActive ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
      ) : null}
    </>
  );

  if (item.disabled) {
    return (
      <div
        className="flex cursor-not-allowed items-start gap-3 rounded-md px-3 py-2.5 opacity-60"
        aria-disabled
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground hover:bg-accent/60',
      )}
    >
      {content}
    </Link>
  );
}

/**
 * Rodapé mobile: um único gatilho "Navegar em {módulo}" que abre
 * bottom sheet com as seções. Escala com muitos itens / nomes longos.
 * Desktop: oculto (use ModuleSubmenu).
 */
export function ModuleBottomNav({ nav, className }: ModuleBottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = resolveActiveModuleNavItem(nav.items, pathname, nav.homeHref);
  const activeLabel = active?.shortLabel ?? active?.label;

  return (
    <>
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 md:hidden',
          'border-t border-[#1254d4] bg-[#1764F5] text-white shadow-[0_-4px_16px_rgba(23,100,245,0.28)]',
          'pb-[env(safe-area-inset-bottom)]',
          className,
        )}
      >
        <div className="mx-auto flex h-14 max-w-lg items-center px-2">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'h-11 w-full justify-between gap-2 px-3 font-medium text-white',
              'hover:bg-white/15 hover:text-white',
              'focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-0',
            )}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <LayoutList className="h-4 w-4 shrink-0 text-white" />
              <span className="truncate">Navegar em {nav.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-white/90">
              {activeLabel ? (
                <span className="max-w-[7rem] truncate rounded-full bg-white/15 px-2 py-0.5 text-xs">
                  {activeLabel}
                </span>
              ) : null}
              <ChevronUp className="h-4 w-4 text-white" />
            </span>
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className={cn(
            'top-auto bottom-0 left-0 right-0 max-h-[85dvh] w-full max-w-none',
            'translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
            'md:hidden',
          )}
        >
          <DialogHeader className="border-b px-4 py-4 text-left">
            <DialogTitle>Navegar em {nav.label}</DialogTitle>
            <DialogDescription>
              Escolha uma seção do módulo para continuar.
            </DialogDescription>
          </DialogHeader>
          <nav className="overflow-y-auto px-2 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {nav.items.map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                isActive={active?.href === item.href}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </nav>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Altura da barra + safe area — use no padding do layout do módulo. */
export const MODULE_BOTTOM_NAV_PADDING_CLASS =
  'pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0';
