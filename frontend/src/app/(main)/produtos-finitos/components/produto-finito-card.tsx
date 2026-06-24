'use client';

import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProdutoFinitoThumb } from '@/components/produtos-finitos/ProdutoFinitoThumb';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type ProdutoFinitoCardItem = {
  id: string;
  nome: string;
  sku: string;
  preco_venda: number | string;
  preco_promocional?: number | string | null;
  estoque_atual: number;
  categoria?: { id: string; nome: string } | null;
  imagens?: Array<{ id: string; url_imagem: string; ordem: number }>;
};

interface ProdutoFinitoCardProps {
  produto: ProdutoFinitoCardItem;
  onDelete: (produto: ProdutoFinitoCardItem) => void;
}

function resolverPrecos(produto: ProdutoFinitoCardItem) {
  const precoVenda = Number(produto.preco_venda) || 0;
  const precoPromocional =
    produto.preco_promocional != null ? Number(produto.preco_promocional) : null;
  const temPromocao =
    precoPromocional != null &&
    Number.isFinite(precoPromocional) &&
    precoPromocional > 0 &&
    precoPromocional < precoVenda;

  return {
    precoVenda,
    precoExibido: temPromocao ? precoPromocional : precoVenda,
    temPromocao,
    descontoPct: temPromocao
      ? Math.round((1 - precoPromocional / precoVenda) * 100)
      : 0,
  };
}

export function ProdutoFinitoCard({ produto, onDelete }: ProdutoFinitoCardProps) {
  const { precoVenda, precoExibido, temPromocao, descontoPct } =
    resolverPrecos(produto);
  const estoqueBaixo = produto.estoque_atual > 0 && produto.estoque_atual <= 5;
  const semEstoque = produto.estoque_atual <= 0;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square w-full bg-muted/30">
        <ProdutoFinitoThumb
          url={produto.imagens?.[0]?.url_imagem}
          alt={produto.nome}
          fit="contain"
          className="h-full w-full rounded-none border-0"
        />
        {temPromocao && descontoPct > 0 ? (
          <Badge className="absolute right-2 top-2 rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            {descontoPct}% OFF
          </Badge>
        ) : null}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          {produto.categoria?.nome ? (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {produto.categoria.nome}
            </p>
          ) : null}
          <h3
            className="line-clamp-2 text-base font-semibold leading-snug text-foreground"
            title={produto.nome}
          >
            {produto.nome}
          </h3>
          <p className="text-xs text-muted-foreground">SKU: {produto.sku}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(precoExibido)}
            </span>
            {temPromocao ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(precoVenda)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estoque</span>
            <span
              className={cn(
                'font-medium',
                semEstoque && 'text-destructive',
                estoqueBaixo && !semEstoque && 'text-amber-600',
              )}
            >
              {produto.estoque_atual}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <Link href={`/produtos-finitos/editar/${produto.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => onDelete(produto)}
              aria-label={`Excluir ${produto.nome}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
