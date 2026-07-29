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
import {
  ADMIN_ROLE_LABELS,
  formatAdminAuditAction,
  formatAdminDate,
} from '@/lib/gestao/admin-labels';
import { AdminAuditEntry } from '@/lib/gestao/admin-types';

export function createAdminAuditColumns(options: {
  onOpenDetail: (entry: AdminAuditEntry) => void;
}): ColumnDef<AdminAuditEntry>[] {
  return [
    {
      accessorKey: 'occurred_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Quando
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatAdminDate(row.original.occurred_at),
    },
    {
      accessorKey: 'action',
      header: 'Ação',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">
            {formatAdminAuditAction(row.original.action)}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.resource_type}
            {row.original.resource_id ? ` · ${row.original.resource_id}` : ''}
          </p>
        </div>
      ),
    },
    {
      id: 'actor',
      header: 'Administrador',
      cell: ({ row }) => {
        const actor = row.original.admin_user;
        if (!actor) {
          return (
            <span className="text-muted-foreground">Sistema / anônimo</span>
          );
        }
        return (
          <div>
            <p className="font-medium">{actor.nome}</p>
            <p className="text-xs text-muted-foreground">
              {ADMIN_ROLE_LABELS[actor.role] || actor.role}
            </p>
          </div>
        );
      },
    },
    {
      id: 'store',
      header: 'Loja',
      cell: ({ row }) => {
        const store = row.original.loja;
        if (!store) return '—';
        return (
          <Link
            href={`/gestao/lojas/${store.id}`}
            className="font-medium hover:underline"
          >
            {store.nome}
          </Link>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) =>
        row.original.category ? (
          <Badge variant="outline">{row.original.category}</Badge>
        ) : (
          '—'
        ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
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
              <DropdownMenuItem
                onClick={() => options.onOpenDetail(row.original)}
              >
                Ver detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}
