'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/** Sobrescreve sm:max-w-lg do DialogContent padrão e evita scroll horizontal. */
export const CATALOGO_INLINE_DIALOG_CLASS =
  'flex max-h-[min(90dvh,880px)] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl';

interface CatalogoInlineDialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}

export function CatalogoInlineDialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: CatalogoInlineDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(CATALOGO_INLINE_DIALOG_CLASS)}>
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
