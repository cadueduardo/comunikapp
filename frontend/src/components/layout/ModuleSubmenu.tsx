'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-media-query';
import type { ModuleNavConfig, ModuleNavItem } from '@/lib/module-nav';
import { cn } from '@/lib/utils';

type ModuleSubmenuProps = {
  nav: ModuleNavConfig;
  /** Href do item ativo (já resolvido pelo ModuleHeader). */
  activeHref?: string;
  /** Texto exibido no gatilho (título da página ou label do item ativo). */
  title: string;
  icon?: ReactNode;
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
      {isActive ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> : null}
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
          : 'hover:bg-accent/60 text-foreground',
      )}
    >
      {content}
    </Link>
  );
}

export function ModuleSubmenu({
  nav,
  activeHref,
  title,
  icon,
}: ModuleSubmenuProps) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = useState(false);

  const triggerClassName = cn(
    'h-auto max-w-full justify-start gap-2 px-2 py-1 text-left font-bold',
    'text-2xl sm:text-3xl hover:bg-accent/50',
  );

  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          className={triggerClassName}
          aria-haspopup="dialog"
          aria-expanded={openMobile}
          onClick={() => setOpenMobile(true)}
        >
          {icon}
          <span className="truncate">{title}</span>
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Button>
        <Dialog open={openMobile} onOpenChange={setOpenMobile}>
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
              <DialogTitle>{nav.label}</DialogTitle>
              <DialogDescription>
                Escolha uma seção do módulo para navegar.
              </DialogDescription>
            </DialogHeader>
            <nav className="overflow-y-auto px-2 py-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {nav.items.map((item) => (
                <NavItemRow
                  key={item.id}
                  item={item}
                  isActive={activeHref === item.href}
                  onNavigate={() => setOpenMobile(false)}
                />
              ))}
            </nav>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={triggerClassName}
          aria-haspopup="menu"
        >
          {icon}
          <span className="truncate">{title}</span>
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(100vw-2rem,22rem)] p-1">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {nav.label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {nav.items.map((item) => {
          const isActive = activeHref === item.href;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <DropdownMenuItem
                key={item.id}
                disabled
                className="items-start gap-3 py-2.5 opacity-60"
              >
                {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.badge ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </span>
                  {item.description ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground whitespace-normal">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem key={item.id} asChild className="p-0 focus:bg-transparent">
              <Link
                href={item.href}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-sm px-2 py-2.5 outline-none',
                  isActive ? 'bg-accent' : 'focus:bg-accent',
                )}
              >
                {Icon ? (
                  <Icon
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    <span>{item.label}</span>
                    {item.badge ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </span>
                  {item.description ? (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground whitespace-normal">
                      {item.description}
                    </span>
                  ) : null}
                </span>
                {isActive ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
