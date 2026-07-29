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
  formatAdminDate,
  INVITATION_STATUS_LABELS,
} from '@/lib/gestao/admin-labels';
import { AdminInvitation } from '@/lib/gestao/admin-types';

export function createAdminInvitationColumns(options: {
  onResend: (invitation: AdminInvitation) => void;
  onCancel: (invitation: AdminInvitation) => void;
}): ColumnDef<AdminInvitation>[] {
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
        <Badge variant="outline">
          {INVITATION_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'expires_at',
      header: 'Validade',
      cell: ({ row }) => formatAdminDate(row.original.expires_at),
    },
    {
      id: 'invited_by',
      header: 'Convidado por',
      cell: ({ row }) => row.original.invited_by?.nome || 'Bootstrap',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const invitation = row.original;
        const canManage = ['PENDING', 'EXPIRED'].includes(invitation.status);
        if (!canManage) return null;

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
                <DropdownMenuItem onClick={() => options.onResend(invitation)}>
                  Reenviar
                </DropdownMenuItem>
                {invitation.status === 'PENDING' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => options.onCancel(invitation)}
                    >
                      Cancelar convite
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
