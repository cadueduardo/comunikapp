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
import type { ContaPagarApi } from '@/lib/api-client';

export type ContaPagar = ContaPagarApi;

export const statusContaPagarLabel: Record<string, string> = {
  PREVISTA: 'Prevista',
  ABERTA: 'Aberta',
  PARCIAL_PAGO: 'Parcialmente paga',
  PAGA: 'Paga',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
};

export const statusParcelaContaPagarLabel: Record<string, string> = {
  PREVISTO: 'Previsto',
  PARCIAL_PAGO: 'Parcialmente pago',
  PAGO: 'Pago',
  VENCIDO: 'Vencido',
  CANCELADA: 'Cancelada',
};

export const metodoPagamentoLabel: Record<string, string> = {
  PIX: 'PIX',
  TED: 'TED',
  BOLETO: 'Boleto',
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão',
  OUTRO: 'Outro',
};

function formatMoeda(valor: number | string) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatData(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function proximoVencimento(conta: ContaPagar) {
  const parcelas = conta.parcelas ?? [];
  if (parcelas.length === 0) return undefined;
  return parcelas.reduce((min, p) => {
    const d = new Date(p.data_vencimento).getTime();
    return d < min ? d : min;
  }, new Date(parcelas[0].data_vencimento).getTime());
}

export const createColumns = (): ColumnDef<ContaPagar>[] => [
  {
    accessorKey: 'numero_documento',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nº documento
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.original.numero_documento}</div>
    ),
  },
  {
    id: 'fornecedor',
    header: 'Fornecedor',
    cell: ({ row }) =>
      row.original.fornecedor?.nome ?? row.original.fornecedor_id,
  },
  {
    accessorKey: 'valor_total',
    header: 'Valor',
    cell: ({ row }) => formatMoeda(row.original.valor_total),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="secondary">
        {statusContaPagarLabel[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    id: 'vencimento',
    header: 'Vencimento',
    cell: ({ row }) => {
      const ts = proximoVencimento(row.original);
      return formatData(ts ? new Date(ts).toISOString() : undefined);
    },
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
                <Link href={`/financeiro/contas-pagar/${item.id}`}>Abrir</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
