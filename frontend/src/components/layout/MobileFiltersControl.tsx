'use client';

import { useState, type ReactNode } from 'react';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type MobileFiltersControlProps = {
  /** Quantidade de filtros ativos (badge no FAB). */
  activeCount?: number;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Conteúdo do rodapé do sheet (ex.: Limpar / Aplicar). */
  footer?: ReactNode;
  className?: string;
  /**
   * Eleva o FAB acima do ModuleBottomNav.
   * Default true — use false em páginas sem rodapé de módulo.
   */
  aboveModuleNav?: boolean;
};

/**
 * Padrão mobile de filtros: FAB fixo com ícone → bottom sheet.
 * Desktop: não renderiza (use filtros inline na página).
 */
export function MobileFiltersControl({
  activeCount = 0,
  title = 'Filtros',
  description = 'Refine a lista com busca e filtros.',
  children,
  footer,
  className,
  aboveModuleNav = true,
}: MobileFiltersControlProps) {
  const [open, setOpen] = useState(false);
  const hasActive = activeCount > 0;

  return (
    <div className={cn('md:hidden', className)}>
      <Button
        type="button"
        size="icon"
        className={cn(
          'fixed z-30 h-12 w-12 rounded-full shadow-lg',
          'bg-[#1764F5] text-white hover:bg-[#1254d4] hover:text-white',
          aboveModuleNav
            ? 'bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-4'
            : 'bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4',
        )}
        aria-label={title}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Filter className="h-5 w-5" />
        {hasActive ? (
          <Badge
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] text-destructive-foreground"
          >
            {activeCount > 9 ? '9+' : activeCount}
          </Badge>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className={cn(
            'top-auto bottom-0 left-0 right-0 max-h-[85dvh] w-full max-w-none',
            'translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0',
            'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
            'data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100',
          )}
        >
          <DialogHeader className="border-b px-4 py-4 text-left">
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-4 py-4">
            {children}
          </div>
          <DialogFooter className="flex-col gap-2 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-col">
            {footer}
            <Button
              type="button"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Ver resultados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type MobileFiltersClearProps = {
  onClear: () => void;
  disabled?: boolean;
};

export function MobileFiltersClearButton({
  onClear,
  disabled,
}: MobileFiltersClearProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled}
      onClick={onClear}
    >
      <X className="mr-2 h-4 w-4" />
      Limpar filtros
    </Button>
  );
}
