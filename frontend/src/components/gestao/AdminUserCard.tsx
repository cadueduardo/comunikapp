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
  ADMIN_USER_STATUS_LABELS,
  formatAdminDate,
} from '@/lib/gestao/admin-labels';
import { AdminUser } from '@/lib/gestao/admin-types';

interface AdminUserCardProps {
  user: AdminUser;
  currentAdminId?: string;
  onChangeRole: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
}

export function AdminUserCard({
  user,
  currentAdminId,
  onChangeRole,
  onToggleStatus,
}: AdminUserCardProps) {
  const isSelf = user.id === currentAdminId;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{user.nome}</h3>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 shrink-0 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onChangeRole(user)}>
              Alterar perfil
            </DropdownMenuItem>
            {!isSelf && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleStatus(user)}>
                  {user.status === 'ACTIVE' ? 'Inativar' : 'Reativar'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{ADMIN_ROLE_LABELS[user.role]}</Badge>
        <Badge variant={user.status === 'ACTIVE' ? 'outline' : 'secondary'}>
          {ADMIN_USER_STATUS_LABELS[user.status]}
        </Badge>
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p>2FA: {user.twoFactorEnabled ? 'Ativo' : 'Pendente'}</p>
        <p>Sessões ativas: {user.activeSessions}</p>
        <p>Último login: {formatAdminDate(user.lastLoginAt)}</p>
      </div>
    </div>
  );
}
