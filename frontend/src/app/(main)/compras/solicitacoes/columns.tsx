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
import type { SolicitacaoCompraApi } from '@/lib/api-client';

export type SolicitacaoCompra = SolicitacaoCompraApi;

export const statusSolicitacaoLabel: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  SOLICITADA: 'Solicitada',
  APROVADA: 'Aprovada',
  CONVERTIDA: 'Convertida',
  REJEITADA: 'Rejeitada',
  DEVOLVIDA: 'Devolvida',
  CANCELADA: 'Cancelada',
};

export const prioridadeLabel: Record<string, string> = {
  BAIXA: 'Baixa',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const createColumns = (): ColumnDef<SolicitacaoCompra>[] => [
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
        {statusSolicitacaoLabel[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'prioridade',
    header: 'Prioridade',
    cell: ({ row }) =>
      prioridadeLabel[row.original.prioridade] ?? row.original.prioridade,
  },
  {
    accessorKey: 'origem_tipo',
    header: 'Origem',
  },
  {
    id: 'itens',
    header: 'Itens',
    cell: ({ row }) => row.original.itens?.length ?? 0,
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
                <Link href={`/compras/solicitacoes/editar/${item.id}`}>
                  Abrir
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
