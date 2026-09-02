'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFavoritos } from '@/contexts/FavoritosContext';

export function FavoritosDashboard() {
  const { destinos, carregado } = useFavoritos();
  if (!carregado || destinos.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Favoritos</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {destinos.map((destino) => {
          const Icon = destino.item.icon;
          return (
            <Link key={destino.id} href={destino.href} className="block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {Icon ? (
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    ) : (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    )}
                    <div>
                      <CardTitle className="text-base">{destino.label}</CardTitle>
                      {destino.item.description ? (
                        <CardDescription className="text-sm">
                          {destino.item.description}
                        </CardDescription>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
