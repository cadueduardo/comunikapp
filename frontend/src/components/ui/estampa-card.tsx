'use client';

import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import { formatCurrency } from '@/lib/utils';

export type EstampaCardItem = {
  id: string;
  nome: string;
  codigo?: string | null;
  ativo: boolean;
  preco_adicional?: number | string | null;
  arte_mestra_url?: string | null;
  processo?: { id: string; nome: string } | null;
};

interface EstampaCardProps {
  estampa: EstampaCardItem;
  onDelete: (estampa: EstampaCardItem) => void;
}

export function EstampaCard({ estampa, onDelete }: EstampaCardProps) {
  const precoAdicional = Number(estampa.preco_adicional ?? 0);

  return (
    <Card className="group flex h-full flex-col overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full bg-muted/30">
        <ProdutoFinitoThumb
          url={estampa.arte_mestra_url}
          alt={estampa.nome}
          fit="contain"
          className="h-full w-full rounded-none border-0"
        />
        <Badge
          className="absolute right-2 top-2"
          variant={estampa.ativo ? 'default' : 'secondary'}
        >
          {estampa.ativo ? 'Ativa' : 'Inativa'}
        </Badge>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3
            className="line-clamp-2 text-base font-semibold leading-snug text-foreground"
            title={estampa.nome}
          >
            {estampa.nome}
          </h3>
          {estampa.codigo ? (
            <p className="text-xs text-muted-foreground">Código: {estampa.codigo}</p>
          ) : null}
          {estampa.processo?.nome ? (
            <p className="text-xs text-muted-foreground">
              Processo: {estampa.processo.nome}
            </p>
          ) : null}
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Preço adicional</span>
            <span className="font-medium">{formatCurrency(precoAdicional)}</span>
          </div>

          <div className="flex gap-2 pt-1">
            <Link href={`/catalogo/estampas/editar/${estampa.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => onDelete(estampa)}
              aria-label={`Inativar ${estampa.nome}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
