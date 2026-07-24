'use client';

import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getModuleHubCardItems,
  type ModuleNavConfig,
} from '@/lib/module-nav';
import { cn } from '@/lib/utils';

type ModuleHubCardsProps = {
  nav: ModuleNavConfig;
  className?: string;
  /** Classes do grid (default 1/2/3 cols). */
  gridClassName?: string;
};

/**
 * Cards de atalho da home do módulo — derivados da mesma ModuleNavConfig
 * usada no submenu / bottom sheet (fonte única de seções).
 */
export function ModuleHubCards({
  nav,
  className,
  gridClassName,
}: ModuleHubCardsProps) {
  const items = getModuleHubCardItems(nav);

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
        gridClassName,
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const card = (
          <Card
            className={cn(
              'h-full',
              item.disabled
                ? 'opacity-70'
                : 'cursor-pointer transition-shadow hover:shadow-md',
            )}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {Icon ? (
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                ) : null}
                <div>
                  <CardTitle className="text-base">
                    {item.label}
                    {item.badge ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {item.badge}
                      </span>
                    ) : null}
                  </CardTitle>
                  {item.description ? (
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                  ) : null}
                </div>
              </div>
            </CardHeader>
          </Card>
        );

        if (item.disabled) {
          return (
            <div key={item.id} aria-disabled="true">
              {card}
            </div>
          );
        }

        return (
          <Link key={item.id} href={item.href} className="block">
            {card}
          </Link>
        );
      })}
    </div>
  );
}
