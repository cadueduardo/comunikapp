'use client';

import { cn } from '@/lib/utils';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import type { EstampaOrcamento } from '@/lib/catalogo/personalizacao-orcamento.types';

interface EstampaThumbGridProps {
  estampas: EstampaOrcamento[];
  selecionadaId?: string;
  onSelecionar: (estampaId: string) => void;
  disabled?: boolean;
}

export function EstampaThumbGrid({
  estampas,
  selecionadaId,
  onSelecionar,
  disabled,
}: EstampaThumbGridProps) {
  if (!estampas.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma estampa vinculada a este produto.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {estampas.map((estampa) => {
        const ativa = selecionadaId === estampa.id;
        return (
          <button
            key={estampa.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelecionar(estampa.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border p-2 text-left transition-colors',
              ativa
                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                : 'border-border hover:border-primary/50 hover:bg-muted/50',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <ProdutoFinitoThumb
              url={estampa.thumb_url || estampa.arte_mestra_url || null}
              alt={estampa.nome}
              className="h-20 w-20"
            />
            <span className="line-clamp-2 w-full text-center text-xs font-medium">
              {estampa.nome}
            </span>
            {Number(estampa.preco_adicional || 0) > 0 ? (
              <span className="text-xs text-muted-foreground">
                + R$ {Number(estampa.preco_adicional).toFixed(2)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
