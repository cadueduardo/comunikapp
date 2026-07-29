'use client';

import { MoreHorizontal } from 'lucide-react';
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

interface AdminInvitationCardProps {
  invitation: AdminInvitation;
  onResend: (invitation: AdminInvitation) => void;
  onCancel: (invitation: AdminInvitation) => void;
}

export function AdminInvitationCard({
  invitation,
  onResend,
  onCancel,
}: AdminInvitationCardProps) {
  const canManage = ['PENDING', 'EXPIRED'].includes(invitation.status);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">
            {invitation.nome}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {invitation.email}
          </p>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onResend(invitation)}>
                Reenviar
              </DropdownMenuItem>
              {invitation.status === 'PENDING' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onCancel(invitation)}>
                    Cancelar convite
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          {INVITATION_STATUS_LABELS[invitation.status]}
        </Badge>
        <Badge variant="secondary">{ADMIN_ROLE_LABELS[invitation.role]}</Badge>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          Validade:{' '}
          <span className="text-foreground">
            {formatAdminDate(invitation.expires_at)}
          </span>
        </p>
        <p>
          Convidado por:{' '}
          <span className="text-foreground">
            {invitation.invited_by?.nome || 'Bootstrap'}
          </span>
        </p>
      </div>
    </div>
  );
}
