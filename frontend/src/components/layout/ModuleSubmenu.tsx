'use client';

import Link from 'next/link';
import { Check, ChevronDown, LayoutList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ModuleNavConfig } from '@/lib/module-nav';
import { cn } from '@/lib/utils';

type ModuleSubmenuProps = {
  nav: ModuleNavConfig;
  /** Href do item ativo (já resolvido pelo ModuleHeader). */
  activeHref?: string;
  /** Texto do botão gatilho. */
  triggerLabel?: string;
  className?: string;
};

/**
 * Submenu de seções do módulo (desktop).
 * Gatilho explícito "Seções" — não usa o título da página.
 */
export function ModuleSubmenu({
  nav,
  activeHref,
  triggerLabel = 'Seções',
  className,
}: ModuleSubmenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('gap-1.5', className)}
          aria-haspopup="menu"
          aria-label={`${triggerLabel} do módulo ${nav.label}`}
        >
          <LayoutList className="h-4 w-4" />
          {triggerLabel}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                    <span className="mt-0.5 block whitespace-normal text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={item.id}
              asChild
              className="p-0 focus:bg-transparent"
            >
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
                    <span className="mt-0.5 block whitespace-normal text-xs font-normal text-muted-foreground">
                      {item.description}
                    </span>
                  ) : null}
                </span>
                {isActive ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                ) : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
