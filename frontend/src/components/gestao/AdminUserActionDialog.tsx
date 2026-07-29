'use client';

import { Loader2, ShieldAlert } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ADMIN_ROLE_LABELS,
  ADMIN_USER_STATUS_LABELS,
} from '@/lib/gestao/admin-labels';
import {
  AdminRole,
  AdminUser,
  AdminUserStatus,
} from '@/lib/gestao/admin-types';

const ROLES = Object.keys(ADMIN_ROLE_LABELS) as AdminRole[];

export type AdminUserDialogMode = 'role' | 'status';

interface AdminUserActionDialogProps {
  user: AdminUser | null;
  mode: AdminUserDialogMode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    role?: AdminRole;
    status?: Extract<AdminUserStatus, 'ACTIVE' | 'INACTIVE'>;
    currentPassword?: string;
    reason: string;
  }) => Promise<void>;
}

export function AdminUserActionDialog({
  user,
  mode,
  open,
  onOpenChange,
  onConfirm,
}: AdminUserActionDialogProps) {
  const [role, setRole] = useState<AdminRole | ''>('');
  const [reason, setReason] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) {
      setRole('');
      setReason('');
      setCurrentPassword('');
      return;
    }
    setRole(user.role);
    setReason('');
    setCurrentPassword('');
  }, [open, user]);

  if (!user || !mode) {
    return null;
  }

  const promotingToSuperAdmin =
    mode === 'role' &&
    user.role !== 'SUPER_ADMIN' &&
    role === 'SUPER_ADMIN';

  const nextStatus: Extract<AdminUserStatus, 'ACTIVE' | 'INACTIVE'> =
    user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 8) return;
    if (mode === 'role' && (!role || role === user.role)) return;
    if (promotingToSuperAdmin && currentPassword.length < 8) return;

    setSubmitting(true);
    try {
      await onConfirm({
        ...(mode === 'role' && role ? { role } : {}),
        ...(mode === 'status' ? { status: nextStatus } : {}),
        ...(promotingToSuperAdmin
          ? { currentPassword }
          : {}),
        reason: reason.trim(),
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <DialogTitle>
              {mode === 'role'
                ? 'Alterar perfil do administrador'
                : nextStatus === 'INACTIVE'
                  ? 'Inativar administrador'
                  : 'Reativar administrador'}
            </DialogTitle>
            <DialogDescription>
              {user.nome} ({user.email}).
              {mode === 'status' && nextStatus === 'INACTIVE'
                ? ' Sessões ativas serão revogadas imediatamente.'
                : null}
              {mode === 'role'
                ? ' A alteração de perfil revoga as sessões ativas.'
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-5">
            {mode === 'role' ? (
              <div className="space-y-2">
                <Label htmlFor="admin-user-role">Novo perfil</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as AdminRole)}
                >
                  <SelectTrigger id="admin-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {ADMIN_ROLE_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Status atual:{' '}
                <span className="font-medium text-foreground">
                  {ADMIN_USER_STATUS_LABELS[user.status]}
                </span>
                . Novo status:{' '}
                <span className="font-medium text-foreground">
                  {ADMIN_USER_STATUS_LABELS[nextStatus]}
                </span>
                .
              </p>
            )}

            {promotingToSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="admin-user-current-password">
                  Sua senha atual
                </Label>
                <Input
                  id="admin-user-current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  minLength={8}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Confirmação obrigatória para promover a Superadministrador.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-user-reason">Justificativa</Label>
              <Textarea
                id="admin-user-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                minLength={8}
                maxLength={1000}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
