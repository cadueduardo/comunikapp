'use client';

import { Star } from 'lucide-react';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { destinoFavoritoPorHref } from '@/lib/favoritos-catalogo';
import type { ModuleNavItem } from '@/lib/module-nav';
import { cn } from '@/lib/utils';

type FavoritoHeaderButtonProps = {
  item?: ModuleNavItem;
  className?: string;
};

/**
 * Estrela no título da página. Sem hub (perfil estreito ou gestor que
 * abre a seção direto), é o jeito de piná-la.
 */
export function FavoritoHeaderButton({
  item,
  className,
}: FavoritoHeaderButtonProps) {
  const { ehFavorito, alternar, carregado } = useFavoritos();
  if (!carregado || !item || item.disabled) return null;

  const destino = destinoFavoritoPorHref(item.href);
  if (!destino) return null;

  const ativo = ehFavorito(destino.id);

  return (
    <button
      type="button"
      aria-pressed={ativo}
      aria-label={
        ativo
          ? `Remover ${destino.label} dos favoritos`
          : `Favoritar ${destino.label}`
      }
      title={ativo ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={cn(
        'rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
      onClick={() => {
        void alternar(destino.id);
      }}
    >
      <Star
        className={
          ativo
            ? 'h-4 w-4 fill-amber-400 text-amber-400'
            : 'h-4 w-4'
        }
      />
    </button>
  );
}
