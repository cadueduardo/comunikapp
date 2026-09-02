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
import { Star } from 'lucide-react';
import { useFavoritos } from '@/contexts/FavoritosContext';

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
  const { ehFavorito, alternar } = useFavoritos();

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
              <div className="flex items-start justify-between gap-2">
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
                {!item.disabled ? (
                  <button
                    type="button"
                    aria-pressed={ehFavorito(`${nav.id}:${item.id}`)}
                    aria-label={
                      ehFavorito(`${nav.id}:${item.id}`)
                        ? `Remover ${item.label} dos favoritos`
                        : `Favoritar ${item.label}`
                    }
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={(evento) => {
                      evento.preventDefault();
                      evento.stopPropagation();
                      void alternar(`${nav.id}:${item.id}`);
                    }}
                  >
                    <Star
                      className={
                        ehFavorito(`${nav.id}:${item.id}`)
                          ? 'h-4 w-4 fill-amber-400 text-amber-400'
                          : 'h-4 w-4'
                      }
                    />
                  </button>
                ) : null}
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
