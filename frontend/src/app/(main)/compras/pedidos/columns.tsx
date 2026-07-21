'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PedidoCompraApi } from '@/lib/api-client';

export type PedidoCompra = PedidoCompraApi;

export const statusPedidoLabel: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_APROVACAO: 'Em aprovação',
  APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado',
  ENVIADO: 'Enviado',
  PARCIAL: 'Parcial',
  ATENDIDO: 'Atendido',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export const createColumns = (): ColumnDef<PedidoCompra>[] => [
  {
    accessorKey: 'numero',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Número
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.original.numero}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {statusPedidoLabel[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    id: 'fornecedor',
    header: 'Fornecedor',
    cell: ({ row }) =>
      row.original.fornecedor?.nome ?? row.original.fornecedor_id,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) =>
      Number(row.original.total).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="text-right">
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
                <Link href={`/compras/pedidos/editar/${item.id}`}>Abrir</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
