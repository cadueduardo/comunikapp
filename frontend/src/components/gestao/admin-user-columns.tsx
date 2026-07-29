'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_USER_STATUS_LABELS,
  formatAdminDate,
} from '@/lib/gestao/admin-labels';
import { AdminUser } from '@/lib/gestao/admin-types';

export function createAdminUserColumns(options: {
  currentAdminId?: string;
  onChangeRole: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
}): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.nome}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Perfil',
      cell: ({ row }) => ADMIN_ROLE_LABELS[row.original.role],
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === 'ACTIVE' ? 'outline' : 'secondary'}
        >
          {ADMIN_USER_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'twoFactorEnabled',
      header: '2FA',
      cell: ({ row }) => (row.original.twoFactorEnabled ? 'Ativo' : 'Pendente'),
    },
    {
      accessorKey: 'activeSessions',
      header: 'Sessões',
      cell: ({ row }) => row.original.activeSessions,
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Último login',
      cell: ({ row }) => formatAdminDate(row.original.lastLoginAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === options.currentAdminId;
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
                <DropdownMenuItem onClick={() => options.onChangeRole(user)}>
                  Alterar perfil
                </DropdownMenuItem>
                {!isSelf && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => options.onToggleStatus(user)}
                    >
                      {user.status === 'ACTIVE' ? 'Inativar' : 'Reativar'}
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
