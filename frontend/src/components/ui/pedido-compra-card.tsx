'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import {
  PedidoCompra,
  statusPedidoLabel,
} from '@/app/(main)/compras/pedidos/columns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PedidoCompraCardProps {
  pedido: PedidoCompra;
}

export function PedidoCompraCard({ pedido }: PedidoCompraCardProps) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{pedido.numero}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {pedido.fornecedor?.nome ?? pedido.fornecedor_id}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/compras/pedidos/editar/${pedido.id}`}>Abrir</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">
          {statusPedidoLabel[pedido.status] ?? pedido.status}
        </Badge>
      </div>

      <p className="text-sm font-medium">
        {Number(pedido.total).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      </p>
    </div>
  );
}
