'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { AdminStatusBadge } from '@/components/gestao/AdminStatusBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatAdminDate } from '@/lib/gestao/admin-labels';
import { AdminStore } from '@/lib/gestao/admin-types';

export function createAdminStoreColumns(options: {
  canChangeStatus: boolean;
  onChangeStatus: (store: AdminStore) => void;
}): ColumnDef<AdminStore>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Loja
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <Link
            href={`/gestao/lojas/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.nome}
          </Link>
          <p className="text-xs text-muted-foreground">
            {row.original.email} · {row.original.slug}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <AdminStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'assinatura_ativa',
      header: 'Assinatura',
      cell: ({ row }) =>
        row.original.assinatura_ativa ? 'Ativa' : 'Inativa',
    },
    {
      accessorKey: 'activeUsers',
      header: 'Usuários ativos',
      cell: ({ row }) => row.original.activeUsers,
    },
    {
      accessorKey: 'criado_em',
      header: 'Cadastro',
      cell: ({ row }) => formatAdminDate(row.original.criado_em),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const store = row.original;
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
                  <Link href={`/gestao/lojas/${store.id}`}>Ver detalhes</Link>
                </DropdownMenuItem>
                {options.canChangeStatus && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => options.onChangeStatus(store)}
                    >
                      Alterar status
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
